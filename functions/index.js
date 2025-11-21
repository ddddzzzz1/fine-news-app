"use strict";

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { Expo } = require("expo-server-sdk");

setGlobalOptions({ region: "asia-northeast3", memory: "256MiB", timeoutSeconds: 120 });

if (!admin.apps.length) {
    admin.initializeApp();
}

const firestore = admin.firestore();
const expoClient = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN ?? undefined });

const PUSH_SETTINGS_COLLECTION = "user_push_settings";
const NOTIFICATION_REQUESTS_COLLECTION = "notification_requests";
const SAVED_CONTESTS_COLLECTION = "saved_contests";
const VALID_TOPICS = new Set(["newsletters", "contests", "community", "reminders"]);

const SYMBOLS = {
    nasdaq: { symbol: "^IXIC" },
    dow: { symbol: "^DJI" },
    kospi: { symbol: "^KS11" },
    kosdaq: { symbol: "^KQ11" },
    usdkrw: { symbol: "KRW=X" },
};

const formatQuote = (quote) => {
    if (!quote) return null;
    const value = quote.regularMarketPrice ?? quote.postMarketPrice ?? quote.bid ?? null;
    const changePercent =
        quote.regularMarketChangePercent ??
        quote.postMarketChangePercent ??
        quote.bidChangePercent ??
        null;

    return value !== null
        ? {
              value,
              changePercent: changePercent ?? null,
              raw: {
                  previousClose: quote.regularMarketPreviousClose ?? null,
                  currency: quote.currency ?? null,
                  time: quote.regularMarketTime ?? Date.now() / 1000,
              },
          }
        : null;
};

exports.updateMarketIndices = onSchedule(
    {
        schedule: "every 60 minutes",
        timeZone: "Asia/Seoul",
        retryCount: 3,
    },
    async () => {
        const items = {};

        try {
            const yahooFinance = (await import("yahoo-finance2")).default;
            const quotes = await yahooFinance.quote(Object.values(SYMBOLS).map((entry) => entry.symbol));
            Object.keys(SYMBOLS).forEach((key, idx) => {
                const formatted = formatQuote(quotes[idx]);
                if (formatted) {
                    items[key] = formatted;
                }
            });
        } catch (error) {
            console.error("Failed to fetch Yahoo Finance quotes", error);
        }

        try {
            const btcResponse = await fetch(
                "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
            );
            if (btcResponse.ok) {
                const btcJson = await btcResponse.json();
                const btcData = btcJson?.bitcoin;
                if (btcData?.usd) {
                    items.bitcoin = {
                        value: btcData.usd,
                        changePercent: btcData.usd_24h_change ?? null,
                        raw: { currency: "USD" },
                    };
                }
            } else {
                console.error("CoinGecko response", await btcResponse.text());
            }
        } catch (error) {
            console.error("Failed to fetch Bitcoin price", error);
        }

        if (!Object.keys(items).length) {
            console.warn("No market data fetched; skipping Firestore write.");
            return;
        }

        await firestore
            .collection("system")
            .doc("market_indices")
            .set(
                {
                    items,
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

        console.log("Market indices updated", Object.keys(items));
    }
);

const QUIET_HOURS_FALLBACK = { start_hour: 23, end_hour: 8 };

function getLocalHour(date, timezone = "Asia/Seoul") {
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: timezone,
        });
        return Number(formatter.format(date));
    } catch (error) {
        console.warn("Failed to format timezone hour", timezone, error);
        return date.getUTCHours();
    }
}

function isWithinQuietHours(settings, referenceDate = new Date()) {
    const quiet = settings?.quiet_hours;
    if (!quiet) return false;

    const start = Number.isInteger(quiet.start_hour) ? quiet.start_hour : QUIET_HOURS_FALLBACK.start_hour;
    const end = Number.isInteger(quiet.end_hour) ? quiet.end_hour : QUIET_HOURS_FALLBACK.end_hour;
    const hour = getLocalHour(referenceDate, settings?.timezone ?? "Asia/Seoul");

    if (start === end) return true;
    if (start < end) {
        return hour >= start && hour < end;
    }
    return hour >= start || hour < end;
}

function extractExpoTokens(settings) {
    if (!Array.isArray(settings?.expo_push_tokens)) {
        return [];
    }
    return settings.expo_push_tokens
        .map((entry) => entry?.token)
        .filter((token) => typeof token === "string" && Expo.isExpoPushToken(token));
}

function sanitizeDataPayload(data) {
    if (data && typeof data === "object" && !Array.isArray(data)) {
        return data;
    }
    return {};
}

async function resolveTargetRecipients(target) {
    if (!target || target.type === "all") {
        const snapshot = await firestore.collection(PUSH_SETTINGS_COLLECTION).where("enabled", "==", true).get();
        return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    }

    if (target.type === "topic" && typeof target.key === "string" && VALID_TOPICS.has(target.key)) {
        const snapshot = await firestore
            .collection(PUSH_SETTINGS_COLLECTION)
            .where(`preferences.${target.key}`, "==", true)
            .get();
        return snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .filter((settings) => settings.enabled !== false);
    }

    if (target.type === "user") {
        const ids = Array.isArray(target.ids)
            ? target.ids
            : typeof target.key === "string"
            ? [target.key]
            : [];

        if (!ids.length) {
            return [];
        }

        const snapshots = await Promise.all(
            ids.map(async (uid) => {
                const docSnap = await firestore.collection(PUSH_SETTINGS_COLLECTION).doc(uid).get();
                return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
            })
        );

        return snapshots.filter(Boolean);
    }

    return [];
}

async function buildMessagesForRequest(request, referenceDate = new Date()) {
    const recipients = await resolveTargetRecipients(request?.target);
    if (!recipients.length) {
        return [];
    }

    const title = request?.title ?? "Fine News";
    const body = request?.body ?? "";
    const dataPayload = sanitizeDataPayload(request?.data);

    const messages = [];
    recipients.forEach((settings) => {
        if (settings?.enabled === false) {
            return;
        }

        if (request?.target?.type === "topic") {
            const topicKey = request.target.key;
            if (
                topicKey &&
                settings?.preferences &&
                Object.prototype.hasOwnProperty.call(settings.preferences, topicKey) &&
                settings.preferences[topicKey] === false
            ) {
                return;
            }
        }

        if (isWithinQuietHours(settings, referenceDate)) {
            return;
        }

        const tokens = extractExpoTokens(settings);
        tokens.forEach((token) => {
            messages.push({
                to: token,
                sound: "default",
                title,
                body,
                data: dataPayload,
            });
        });
    });

    return messages;
}

async function dispatchExpoNotifications(messages) {
    if (!Array.isArray(messages) || !messages.length) {
        return [];
    }

    const validMessages = messages.filter((message) => Expo.isExpoPushToken(message.to));
    if (!validMessages.length) {
        return [];
    }

    const chunks = expoClient.chunkPushNotifications(validMessages);
    const tickets = [];

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expoClient.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
            ticketChunk.forEach((ticket, idx) => {
                if (ticket.status === "error") {
                    console.error("Push ticket error", ticket, "payload", chunk[idx]);
                }
            });
        } catch (error) {
            console.error("Failed to send push notification chunk", error);
        }
    }

    console.log(`Dispatched ${validMessages.length} Expo push messages`);
    return tickets;
}

function coerceDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === "function") {
        try {
            return value.toDate();
        } catch (error) {
            console.warn("Failed to convert Firestore timestamp", error);
        }
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

exports.processNotificationQueue = onSchedule(
    {
        schedule: "every 5 minutes",
        timeZone: "Asia/Seoul",
        retryCount: 0,
    },
    async () => {
        const now = admin.firestore.Timestamp.now();
        const readySnapshot = await firestore
            .collection(NOTIFICATION_REQUESTS_COLLECTION)
            .where("send_after", "<=", now)
            .orderBy("send_after", "asc")
            .limit(20)
            .get();

        if (readySnapshot.empty) {
            console.log("No pending notification requests");
            return;
        }

        const nowDate = new Date();

        for (const docSnap of readySnapshot.docs) {
            const request = docSnap.data();
            const messages = await buildMessagesForRequest(request, nowDate);

            if (!messages.length) {
                console.log(`Notification ${docSnap.id} has no deliverable recipients.`);
                await docSnap.ref.delete();
                continue;
            }

            await dispatchExpoNotifications(messages);
            await docSnap.ref.delete();
        }
    }
);

exports.sendContestDeadlineDigest = onSchedule(
    {
        schedule: "0 9 * * *",
        timeZone: "Asia/Seoul",
        retryCount: 0,
    },
    async () => {
        const now = new Date();
        const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const startTs = admin.firestore.Timestamp.fromDate(now);
        const endTs = admin.firestore.Timestamp.fromDate(cutoff);

        const snapshot = await firestore
            .collection(SAVED_CONTESTS_COLLECTION)
            .where("end_date", ">=", startTs)
            .where("end_date", "<=", endTs)
            .limit(500)
            .get();

        if (snapshot.empty) {
            console.log("Contest reminder: no saved contests ending within 24h.");
            return;
        }

        const contestsByUser = {};
        snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const userId = data?.user_id;
            if (!userId) {
                return;
            }
            const endDate = coerceDate(data.end_date);
            if (!endDate) {
                return;
            }

            contestsByUser[userId] = contestsByUser[userId] || [];
            contestsByUser[userId].push({
                id: docSnap.id,
                ...data,
                endDate,
            });
        });

        const messages = [];
        const userIds = Object.keys(contestsByUser);

        for (const userId of userIds) {
            const settingsSnap = await firestore.collection(PUSH_SETTINGS_COLLECTION).doc(userId).get();
            if (!settingsSnap.exists) {
                continue;
            }

            const settings = settingsSnap.data();
            if (settings?.enabled === false || settings?.preferences?.reminders === false) {
                continue;
            }
            if (isWithinQuietHours(settings, now)) {
                continue;
            }

            const tokens = extractExpoTokens(settings);
            if (!tokens.length) {
                continue;
            }

            const contests = contestsByUser[userId];
            contests.sort((a, b) => a.endDate - b.endDate);

            const [nearestContest] = contests;
            const reminderBody =
                contests.length === 1
                    ? `${nearestContest?.title ?? "저장한 공모전"} 마감이 하루 남았습니다.`
                    : `${nearestContest?.title ?? "저장한 공모전"} 외 ${contests.length - 1}개의 마감이 임박했어요.`;

            const dataPayload = {
                screen: "/saved-contests",
                contestIds: contests
                    .map((contest) => contest?.contest_id || contest?.id)
                    .filter(Boolean),
                type: "contestDeadline",
            };

            tokens.forEach((token) => {
                messages.push({
                    to: token,
                    sound: "default",
                    title: "마감 임박 공모전",
                    body: reminderBody,
                    data: dataPayload,
                });
            });
        }

        if (!messages.length) {
            console.log("Contest reminder: no users with push tokens/preference enabled.");
            return;
        }

        await dispatchExpoNotifications(messages);
        console.log(`Contest reminder: sent ${messages.length} messages to ${userIds.length} users.`);
    }
);
