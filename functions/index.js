"use strict";

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const yahooFinance = require("yahoo-finance2").default;
const fetch = require("node-fetch");

setGlobalOptions({ region: "asia-northeast3", memory: "256MiB", timeoutSeconds: 120 });

if (!admin.apps.length) {
    admin.initializeApp();
}

const firestore = admin.firestore();

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
