import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MARKET_INDEX_DEFAULT_ITEMS, MARKET_INDEX_CONFIG } from "../shared/marketIndices";

const YAHOO_SYMBOL_OVERRIDES = {
    usdkrw: "KRW=X",
};

const SYMBOL_TO_ID = MARKET_INDEX_CONFIG.reduce((acc, item) => {
    const symbol = (YAHOO_SYMBOL_OVERRIDES[item.id] ?? item.symbol)?.toUpperCase();
    if (symbol) {
        acc[symbol] = item.id;
    }
    return acc;
}, {});

const getQuerySymbolList = () =>
    MARKET_INDEX_CONFIG.map((item) => YAHOO_SYMBOL_OVERRIDES[item.id] ?? item.symbol).filter(Boolean);

const YAHOO_HOSTS = [
    "https://query1.finance.yahoo.com",
    "https://query2.finance.yahoo.com",
];

const YAHOO_HEADERS = {
    "User-Agent": "FineNews/1.0 (Expo React Native)",
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
};

const formatValue = (value, id) => {
    if (value === undefined || value === null) return undefined;
    const decimals = id === "bitcoin" ? 0 : id === "usdkrw" ? 2 : 2;
    const formatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    if (id === "bitcoin") {
        return `$${formatter.format(value)}`;
    }
    return formatter.format(value);
};

const formatChange = (percent) => {
    if (percent === undefined || percent === null) return undefined;
    const parsed = typeof percent === "number" ? percent : Number(percent);
    if (Number.isNaN(parsed)) return undefined;
    return `${parsed >= 0 ? "+" : ""}${parsed.toFixed(2)}%`;
};

const HALF_HOUR_MS = 30 * 60 * 1000;

const normalizeNumber = (value) => {
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const calculatePercentChange = (current, previous) => {
    const currentValue = normalizeNumber(current);
    const previousValue = normalizeNumber(previous);
    if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue === 0) {
        return undefined;
    }
    return ((currentValue - previousValue) / previousValue) * 100;
};

async function fetchYahooMarketSnapshot() {
    const symbols = getQuerySymbolList();
    if (!symbols.length) return null;
    const symbolParam = encodeURIComponent(symbols.join(","));
    let lastError = null;

    for (const host of YAHOO_HOSTS) {
        const url = `${host}/v7/finance/spark?interval=1d&range=1d&symbols=${symbolParam}`;
        try {
            const response = await fetch(url, {
                headers: YAHOO_HEADERS,
            });
            if (!response.ok) {
                lastError = new Error(`Failed to fetch quotes (${response.status})`);
                continue;
            }
            const payload = await response.json();
            const results = payload?.spark?.result ?? [];
            const items = results.reduce((acc, entry) => {
                const symbol = entry?.symbol?.toUpperCase();
                const id = symbol ? SYMBOL_TO_ID[symbol] : undefined;
                if (!id) return acc;

                const snapshot = entry?.response?.[0];
                const meta = snapshot?.meta ?? {};
                const closeSeries = snapshot?.close ?? [];
                const lastClose = closeSeries.length ? closeSeries[closeSeries.length - 1] : undefined;
                const currentValue = normalizeNumber(meta.regularMarketPrice ?? lastClose);
                const previousClose = normalizeNumber(meta.chartPreviousClose ?? meta.previousClose);
                const timestamps = snapshot?.timestamp ?? [];
                const updatedAt = meta.regularMarketTime
                    ? meta.regularMarketTime * 1000
                    : timestamps.length
                        ? timestamps[timestamps.length - 1] * 1000
                        : Date.now();

                acc[id] = {
                    value: currentValue ?? previousClose,
                    changePercent: calculatePercentChange(currentValue ?? lastClose, previousClose),
                    updatedAt,
                };
                return acc;
            }, {});
            return {
                fetchedAt: Date.now(),
                items,
            };
        } catch (error) {
            lastError = error;
            continue;
        }
    }

    if (lastError) {
        console.log("Error fetching market indices from Yahoo Finance", lastError);
    }
    return null;
}

export function useMarketIndices() {
    const queryResult = useQuery({
        queryKey: ["market-indices", "live"],
        queryFn: fetchYahooMarketSnapshot,
        refetchInterval: HALF_HOUR_MS,
        refetchIntervalInBackground: true,
        staleTime: 1000 * 60 * 60,
    });

    const displayIndices = useMemo(() => {
        const items = queryResult.data?.items;
        if (!items) return MARKET_INDEX_DEFAULT_ITEMS;
        return MARKET_INDEX_DEFAULT_ITEMS.map((item) => {
            const live = items[item.id];
            if (!live) return item;
            return {
                ...item,
                value: formatValue(live.value, item.id) ?? item.value,
                change: formatChange(live.changePercent ?? live.change_percent) ?? item.change,
                updatedAt: live.updatedAt ?? queryResult.data?.fetchedAt,
            };
        });
    }, [queryResult.data]);

    return {
        indices: displayIndices,
        lastUpdatedAt: queryResult.data?.fetchedAt ?? null,
        refetch: queryResult.refetch,
        isLoading: queryResult.isLoading,
        isFetching: queryResult.isFetching,
        error: queryResult.error,
    };
}
