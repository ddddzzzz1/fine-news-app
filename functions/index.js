"use strict";

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { Expo } = require("expo-server-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

setGlobalOptions({ region: "asia-northeast3", memory: "256MiB", timeoutSeconds: 120 });

if (!admin.apps.length) {
    admin.initializeApp();
}

const firestore = admin.firestore();
const expoClient = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN ?? undefined });
const storageBucket = admin.storage().bucket();

const PUSH_SETTINGS_COLLECTION = "user_push_settings";
const NOTIFICATION_REQUESTS_COLLECTION = "notification_requests";
const SAVED_CONTESTS_COLLECTION = "saved_contests";
const PUSH_TICKETS_COLLECTION = "push_ticket_receipts";
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
        .map((entry) => {
            if (entry?.token && Expo.isExpoPushToken(entry.token)) {
                return {
                    token: entry.token,
                    platform: entry.platform ?? "unknown",
                };
            }
            return null;
        })
        .filter(Boolean);
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

    const entries = [];
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
        tokens.forEach((tokenEntry) => {
            entries.push({
                message: {
                    to: tokenEntry.token,
                    sound: "default",
                    title,
                    body,
                    data: dataPayload,
                },
                meta: {
                    userId: settings.id,
                    topic: request?.target?.type === "topic" ? request.target.key : request?.target?.type ?? "broadcast",
                    platform: tokenEntry.platform ?? "unknown",
                },
            });
        });
    });

    return entries;
}

async function dispatchExpoNotifications(entries) {
    if (!Array.isArray(entries) || !entries.length) {
        return [];
    }

    const validEntries = entries.filter(
        (entry) => Expo.isExpoPushToken(entry?.message?.to) && typeof entry?.message === "object"
    );
    if (!validEntries.length) {
        return [];
    }

    const messages = validEntries.map((entry) => entry.message);
    const metadata = validEntries.map((entry) => entry.meta ?? {});

    const chunks = expoClient.chunkPushNotifications(messages);
    const metadataChunks = [];
    let pointer = 0;
    for (const chunk of chunks) {
        metadataChunks.push(metadata.slice(pointer, pointer + chunk.length));
        pointer += chunk.length;
    }

    const tickets = [];
    const receiptRecords = [];
    const topicTotals = {};
    let successCount = 0;
    let errorCount = 0;

    for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];
        const chunkMeta = metadataChunks[index] ?? [];
        try {
            const ticketChunk = await expoClient.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
            ticketChunk.forEach((ticket, idx) => {
                const meta = chunkMeta[idx] ?? {};
                const payload = chunk[idx];
                if (ticket.status === "error") {
                    errorCount += 1;
                    console.error("Push ticket error", ticket, "payload", payload, "meta", meta);
                } else {
                    successCount += 1;
                }
                if (ticket.id) {
                    receiptRecords.push({
                        ticketId: ticket.id,
                        token: payload.to,
                        userId: meta.userId ?? null,
                        topic: meta.topic ?? null,
                        platform: meta.platform ?? "unknown",
                    });
                }
                if (meta.topic) {
                    topicTotals[meta.topic] = (topicTotals[meta.topic] || 0) + 1;
                }
            });
        } catch (error) {
            console.error("Failed to send push notification chunk", error);
        }
    }

    if (receiptRecords.length) {
        const batch = firestore.batch();
        receiptRecords.forEach((record) => {
            const ref = firestore.collection(PUSH_TICKETS_COLLECTION).doc(record.ticketId);
            batch.set(ref, {
                token: record.token,
                user_id: record.userId,
                topic: record.topic,
                platform: record.platform,
                processed: false,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
    }

    console.log("Push dispatch summary", {
        total: messages.length,
        success: successCount,
        errors: errorCount,
        topics: topicTotals,
    });

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

async function removeTokenFromUser(userId, token) {
    if (!userId || !token) {
        return;
    }

    const ref = firestore.collection(PUSH_SETTINGS_COLLECTION).doc(userId);
    await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
            return;
        }
        const data = snapshot.data() || {};
        const tokens = Array.isArray(data.expo_push_tokens) ? data.expo_push_tokens : [];
        const filtered = tokens.filter((entry) => entry?.token && entry.token !== token);
        if (filtered.length === tokens.length) {
            return;
        }

        transaction.update(ref, {
            expo_push_tokens: filtered,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
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
            const entries = await buildMessagesForRequest(request, nowDate);

            if (!entries.length) {
                console.log(`Notification ${docSnap.id} has no deliverable recipients.`);
                await docSnap.ref.delete();
                continue;
            }

            await dispatchExpoNotifications(entries);
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

        const entries = [];
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

            tokens.forEach((tokenEntry) => {
                entries.push({
                    message: {
                        to: tokenEntry.token,
                        sound: "default",
                        title: "마감 임박 공모전",
                        body: reminderBody,
                        data: dataPayload,
                    },
                    meta: {
                        userId,
                        topic: "reminders",
                        platform: tokenEntry.platform ?? "unknown",
                    },
                });
            });
        }

        if (!entries.length) {
            console.log("Contest reminder: no users with push tokens/preference enabled.");
            return;
        }

        await dispatchExpoNotifications(entries);
        console.log(`Contest reminder: sent ${entries.length} messages to ${userIds.length} users.`);
    }
);

exports.cleanupPushTokens = onSchedule(
    {
        schedule: "0 3 * * *",
        timeZone: "Asia/Seoul",
        retryCount: 0,
    },
    async () => {
        const snapshot = await firestore
            .collection(PUSH_TICKETS_COLLECTION)
            .where("processed", "==", false)
            .orderBy("created_at", "asc")
            .limit(200)
            .get();

        if (snapshot.empty) {
            console.log("cleanupPushTokens: no pending receipts.");
            return;
        }

        const ticketMetadata = {};
        snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            ticketMetadata[docSnap.id] = {
                token: data?.token,
                userId: data?.user_id,
                platform: data?.platform ?? "unknown",
            };
        });

        const ticketIds = Object.keys(ticketMetadata);
        const receipts = await expoClient.getPushNotificationReceiptsAsync(ticketIds);

        const platformCounts = {};
        let invalidCount = 0;

        await Promise.all(
            Object.entries(receipts).map(async ([ticketId, receipt]) => {
                const meta = ticketMetadata[ticketId];
                if (!meta) {
                    return;
                }
                if (receipt.status === "error") {
                    const errorCode = receipt.details?.error;
                    if (errorCode === "DeviceNotRegistered" || errorCode === "ExpoPushTokenNotFound") {
                        invalidCount += 1;
                        platformCounts[meta.platform] = (platformCounts[meta.platform] || 0) + 1;
                        await removeTokenFromUser(meta.userId, meta.token);
                    }
                    console.error("Push receipt error", ticketId, receipt.message, receipt.details);
                }
            })
        );

        const batch = firestore.batch();
        snapshot.docs.forEach((docSnap) => {
            batch.update(docSnap.ref, {
                processed: true,
                processed_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();

        console.log("cleanupPushTokens result", {
            processedTickets: ticketIds.length,
            invalidTokens: invalidCount,
            platformCounts,
        });
    }
);

function normalizeStoragePath(path) {
    if (!path || typeof path !== "string") {
        return null;
    }
    return path.replace(/^\/+/g, "");
}

async function deleteFileByPath(path) {
    const normalized = normalizeStoragePath(path);
    if (!normalized) {
        return 0;
    }
    try {
        await storageBucket.file(normalized).delete({ ignoreNotFound: true });
        return 1;
    } catch (error) {
        if (error?.code === 404 || error?.code === 204) {
            return 0;
        }
        console.warn("Failed to delete storage file", normalized, error);
        return 0;
    }
}

async function deleteFilesWithPrefix(prefix) {
    const normalized = normalizeStoragePath(prefix);
    if (!normalized) {
        return 0;
    }
    try {
        const [files] = await storageBucket.getFiles({ prefix: normalized });
        await Promise.all(
            files.map((file) =>
                file.delete({ ignoreNotFound: true }).catch((error) => {
                    console.warn("Failed to delete storage file", file.name, error);
                })
            )
        );
        return files.length;
    } catch (error) {
        console.warn("Failed to list storage files", normalized, error);
        return 0;
    }
}

async function deleteDocsWhere(collectionName, field, value, options = {}) {
    const batchSize = options.batchSize ?? 200;
    let deleted = 0;

    while (true) {
        const snapshot = await firestore.collection(collectionName).where(field, "==", value).limit(batchSize).get();
        if (snapshot.empty) {
            break;
        }

        const batch = firestore.batch();
        for (const docSnap of snapshot.docs) {
            if (typeof options.beforeDelete === "function") {
                await options.beforeDelete(docSnap);
            }
            batch.delete(docSnap.ref);
            deleted += 1;
        }

        await batch.commit();
    }

    return deleted;
}

async function deleteUserProfile(uid) {
    const ref = firestore.collection("user_profiles").doc(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
        return { deleted: false, removedFiles: 0 };
    }

    const data = snapshot.data() || {};
    await ref.delete();

    let removedFiles = 0;
    if (data.student_id_storage_folder) {
        removedFiles += await deleteFilesWithPrefix(data.student_id_storage_folder);
    } else if (data.student_id_storage_path) {
        removedFiles += await deleteFileByPath(data.student_id_storage_path);
    }

    return { deleted: true, removedFiles };
}

async function deleteUserAccountData(uid) {
    const summary = {
        profileDeleted: false,
        removedStudentIdFiles: 0,
        pushSettingsCleared: false,
        savedContestsDeleted: 0,
        calendarEventsDeleted: 0,
        communityPostsDeleted: 0,
        communityImagesDeleted: 0,
    };

    const profileResult = await deleteUserProfile(uid);
    summary.profileDeleted = profileResult.deleted;
    summary.removedStudentIdFiles = profileResult.removedFiles;

    try {
        await firestore.collection(PUSH_SETTINGS_COLLECTION).doc(uid).delete();
        summary.pushSettingsCleared = true;
    } catch (error) {
        console.warn("Failed to delete push settings", uid, error);
    }

    summary.savedContestsDeleted = await deleteDocsWhere(SAVED_CONTESTS_COLLECTION, "user_id", uid);
    summary.calendarEventsDeleted = await deleteDocsWhere("calendar_events", "user_id", uid);
    summary.communityPostsDeleted = await deleteDocsWhere("community_posts", "user_id", uid, {
        beforeDelete: async (docSnap) => {
            const data = docSnap.data() || {};
            if (data?.image_meta?.storage_path) {
                summary.communityImagesDeleted += await deleteFileByPath(data.image_meta.storage_path);
            }
        },
    });

    return summary;
}

exports.closeAccount = onCall(async (request) => {
    const uid = request.auth?.uid;
    const email = request.auth?.token?.email ?? null;

    if (!uid) {
        throw new HttpsError("unauthenticated", "로그인한 사용자만 계정을 삭제할 수 있습니다.");
    }

    try {
        const summary = await deleteUserAccountData(uid);
        try {
            await admin.auth().deleteUser(uid);
        } catch (error) {
            if (error?.code !== "auth/user-not-found") {
                throw error;
            }
        }

        console.log("Account deleted", { uid, email, summary });
        return { ok: true, summary };
    } catch (error) {
        console.error("Failed to delete account", { uid, email, error });
        throw new HttpsError("internal", "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
});

exports.newsFactory = onSchedule(
    {
        schedule: "0 */6 * * *", // Every 6 hours
        timeZone: "Asia/Seoul",
        retryCount: 0,
    },
    async () => {
        await runNewsFactory();
    }
);

exports.scheduledBriefing = onSchedule(
    {
        schedule: "0 */6 * * *", // Every 6 hours (0, 6, 12, 18)
        timeZone: "Asia/Seoul",
        retryCount: 0,
    },
    async () => {
        await runBriefingWorkflow();
    }
);

exports.generateNewsDraft = onCall(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new HttpsError("permission-denied", "Admin only");
    }
    return await runNewsFactory();
});

exports.debugTriggerBriefing = onCall(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new HttpsError("permission-denied", "Admin only");
    }
    return await runBriefingWorkflow();
});

async function runNewsFactory() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not set");
        return { error: "Configuration error" };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
            temperature: 0.2,        // 정확성 ↑ 창의성 ↓
            topP: 0.6,               // 상위 40% 확률만 사용
            topK: 40,                // Gemini 안정 sweet spot
            maxOutputTokens: 4096,   // HTML + JSON용 넉넉한 길이
            responseMimeType: "application/json", // JSON 강제
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
            }
        ]

    });

    // 1. Precise Time Context
    const now = new Date();
    const kstOptions = { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
    const currentDate = new Intl.DateTimeFormat('ko-KR', kstOptions).format(now);

    // 2. The "Editor Assistant" Prompt
    const prompt = `
    역할(Role):
당신은 "경제부 수석 에디터의 리서치 어시스턴트"예요.
대학생과 사회초년생 독자를 위한 기사 재작성의 기초 데이터를 만들어요.

상황(Context):
- 현재 시각(KST): 2025년 12월 03일 13:23
- 당신의 임무는 지난 24시간 동안 나온 "대한민국 경제 뉴스" 중 가장 중요하고 파급력이 큰 단 1건을 선정하는 것이에요.

⚠️ 매우 중요한 규칙(Anchoring Prevention):
- 아래 JSON 스키마에 등장하는 단어, 수치, 문구는 "형식 예시"일 뿐이에요.
- 예시 단어(예: 특정 산업명), 예시 지표명(예: 특정 경제지표), 예시 숫자(예: -0.0%), 예시 태그 등은 절대로 실제 답변에 사용하면 안 돼요.
- 실제 기사 본문과 제목에서 확인한 "진짜 문장/지표/수치/기관명/단어"만 사용해야 해요.
- 사전에 특정 산업(예: 반도체, 자동차, 금융 등)으로 주제를 고정해서는 안 되고, 반드시 검색 결과 기반으로 선택해야 해요.

--------------------------------------------
[뉴스 선정 절차: 반드시 이 순서를 따라야 해요]
--------------------------------------------
1단계) 웹 검색 도구로 다음 조건의 뉴스를 수집:
    - 대한민국 주요 경제 언론사 기사
    - 발행 시각이 "현재 시각 기준 24시간 이내"

2단계) 최소 5개 이상의 기사를 확인한 뒤,
    "정부 정책 변화 / 금리·물가 / 거시경제 지표 / 대기업 실적·전략 / 수출·산업 구조 변화"
    같은 분야 중 파급력이 가장 큰 단 1건을 고르세요.

3단계) 선택한 뉴스 기사에 등장하는 내용만 기반으로
    정확한 수치·팩트·핵심 내용을 추출하세요.

4단계) 아래 JSON 스키마를 형식대로 채우되,
    모든 텍스트는 실제 기사 내용만 사용하여 재작성하세요.

--------------------------------------------
[톤앤매너]
--------------------------------------------
- 분석은 날카롭되, 어조는 구어체로 부드럽게 (“~에요”, “~할 수 있어요”)
- 독자가 던질 질문 “그래서 이게 나랑 무슨 상관인데?”에 답하도록 서술
- 취업(Employment)·투자(Investment) 시장에 어떤 영향을 주는지 구체적으로 설명

--------------------------------------------
[출력 형식 – JSON Only]
--------------------------------------------
아래 JSON은 “형식 예시”이며,
모든 값은 실제 기사에서 확인한 진짜 내용으로 교체해야 해요.

{
  "title": "<기사의 중립적 한국어 헤드라인>",
  "summary": "<핵심을 담은 3문장 요약 (문장 사이에 \\n)>",
  "content_text": "string · 본문의 일반 텍스트 버전 (5W1H 원칙 준수)",
  "tags": ["<실제 기사 태그1>", "<태그2>", "<태그3>"],
  "published_date": "<YYYY-MM-DD HH:mm (KST)>",
  "impact_analysis": {
    "summary": "<이 뉴스가 중요한 이유 한 줄 요약 (~에요)>",
    "investment": "<투자자 관점 분석 (~에요)>",
    "employment": "<취업/직장인 관점 분석 (~에요)>"
  },
  "key_data_points": {
    "hero": {
      "label": "<지표 이름>",
      "value": "<수치>",
      "unit": "<단위>",
      "insight": "<지표 해석 한 줄>"
    },
    "details": [
      { "label": "<세부 지표>", "value": "<수치>", "note": "<설명>" }
    ],
    "highlights": [
      { "tag": "<주제>", "text": "<강조할 포인트>" }
    ],
    "timeline": [
      { "emoji": "🔍", "step": "<주요 발생 단계 1>" },
      { "emoji": "➡️", "step": "<주요 발생 단계 2>" }
    ]
  }
}

--------------------------------------------
[최종 자기 점검 – 반드시 수행]
--------------------------------------------
응답을 생성하기 전, 아래 3가지 질문에 "YES"여야 해요.

1) 이 프롬프트 안의 예시 단어나 예시 숫자는 하나도 쓰지 않았나요?
2) 선택한 뉴스 기사 본문에 실제로 등장하는 단어와 숫자만 썼나요?
3) 주제가 특정 산업이나 예시 키워드로 자동 고정되지 않았고,
   검색 결과에서 중요도가 가장 높은 기사를 실제로 선택했나요?

모두 YES라면 JSON을 출력하세요.
아니라면 검색과 내용을 다시 점검한 뒤 수정하세요.
}
 `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonStr);

        // Duplicate check using title since source_url is removed
        const existing = await firestore.collection("news_drafts")
            .where("title", "==", data.title)
            .get();

        if (!existing.empty) {
            console.log("Duplicate draft found", data.title);
            return { skipped: true, reason: "Duplicate" };
        }

        // Parse published_date to Timestamp
        let publishedTimestamp = admin.firestore.FieldValue.serverTimestamp();
        if (data.published_date) {
            const parsedDate = new Date(data.published_date);
            if (!isNaN(parsedDate.getTime())) {
                publishedTimestamp = admin.firestore.Timestamp.fromDate(parsedDate);
            }
        }

        const draft = {
            ...data,
            state: "pending",
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            published_date: publishedTimestamp, // Set the original publication date
            created_by: "gemini@functions",
            gemini_prompt: prompt,
            gemini_response: data,
        };

        const newsRef = firestore.collection("news_drafts").doc();
        await newsRef.set(draft);

        console.log(`Created news draft: ${newsRef.id}`);
        return { success: true, id: newsRef.id };
    } catch (error) {
        console.error("News Factory failed", error);
        return { error: error.message };
    }
}

async function runBriefingWorkflow() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not set");
        return { error: "Configuration error" };
    }

    // 1. Fetch news from the last 6 hours (plus a buffer to ensure coverage)
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const startTs = admin.firestore.Timestamp.fromDate(sixHoursAgo);

    try {
        const snapshot = await firestore.collection("news_drafts")
            .where("created_at", ">=", startTs)
            .orderBy("created_at", "desc")
            .get();

        if (snapshot.empty) {
            console.log("No news found in the last 6 hours for briefing.");
            return { skipped: true, reason: "No news" };
        }

        const newsItems = snapshot.docs.map(doc => doc.data());

        // If we have very few items, we might want to look back further, but for now stick to the plan.
        console.log(`Found ${newsItems.length} news items for briefing.`);

        const newsContext = newsItems.map((item, index) => `
        [News ${index + 1}]
        Title: ${item.title}
        Source: ${item.source}
        Summary: ${item.summary}
        `).join("\n");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-pro",
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
            },
        });

        const briefingPrompt = `
        Based on the following news articles collected over the last 6 hours, create a comprehensive "Daily Briefing" (or "Periodic Briefing") in Korean.
        The tone should be professional, insightful, and suitable for a mobile app home screen.
        
        News Articles:
        ${newsContext}
        
        Format the output as a JSON object:
        {
            "title": "Briefing Title (e.g., 'Morning Economic Briefing' or 'Market Update')",
            "content": "A 3-5 line summary synthesizing the key trends and events.",
            "key_points": ["Point 1", "Point 2", "Point 3"]
        }
        `;

        const result = await model.generateContent(briefingPrompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const briefingData = JSON.parse(jsonStr);

        const briefingRef = firestore.collection("daily_briefings").doc();
        await briefingRef.set({
            ...briefingData,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            source_news_count: newsItems.length,
            type: "periodic_6h"
        });

        console.log(`Created briefing: ${briefingRef.id}`);
        return { success: true, id: briefingRef.id };

    } catch (error) {
        console.error("Briefing Workflow failed", error);
        return { error: error.message };
    }
}
