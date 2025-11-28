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

async function fetchYahooMarketSnapshot() {
    const symbols = getQuerySymbolList();
    if (!symbols.length) return null;
    const symbolParam = encodeURIComponent(symbols.join(","));
    let lastError = null;

    for (const host of YAHOO_HOSTS) {
        const url = `${host}/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&symbols=${symbolParam}`;
        try {
            const response = await fetch(url, {
                headers: YAHOO_HEADERS,
            });
            if (!response.ok) {
                lastError = new Error(`Failed to fetch quotes (${response.status})`);
                continue;
            }
            const payload = await response.json();
            const results = payload?.quoteResponse?.result ?? [];
            const items = results.reduce((acc, quote) => {
                const symbol = quote?.symbol?.toUpperCase();
                const id = symbol ? SYMBOL_TO_ID[symbol] : undefined;
                if (!id) return acc;
                const rawValue =
                    typeof quote.regularMarketPrice === "number"
                        ? quote.regularMarketPrice
                        : Number(quote.regularMarketPrice);
                const fallbackPrice =
                    typeof quote.regularMarketPreviousClose === "number"
                        ? quote.regularMarketPreviousClose
                        : Number(quote.regularMarketPreviousClose);
                acc[id] = {
                    value: Number.isFinite(rawValue) ? rawValue : fallbackPrice,
                    changePercent:
                        typeof quote.regularMarketChangePercent === "number"
                            ? quote.regularMarketChangePercent
                            : Number(quote.regularMarketChangePercent),
                    updatedAt: quote.regularMarketTime ? quote.regularMarketTime * 1000 : Date.now(),
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
