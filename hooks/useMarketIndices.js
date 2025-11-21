import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { MARKET_INDEX_DEFAULT_ITEMS } from "../shared/marketIndices";

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

export function useMarketIndices() {
    const { data: marketDoc } = useQuery({
        queryKey: ["market-indices"],
        queryFn: async () => {
            try {
                const snap = await getDoc(doc(db, "system", "market_indices"));
                return snap.exists() ? snap.data() : null;
            } catch (error) {
                console.log("Error fetching market indices", error);
                return null;
            }
        },
        staleTime: 1000 * 60 * 10,
    });

    const displayIndices = useMemo(() => {
        const items = marketDoc?.items;
        if (!items) return MARKET_INDEX_DEFAULT_ITEMS;
        return MARKET_INDEX_DEFAULT_ITEMS.map((item) => {
            const live = items[item.id];
            if (!live) return item;
            return {
                ...item,
                value: formatValue(live.value, item.id) ?? item.value,
                change: formatChange(live.changePercent ?? live.change_percent) ?? item.change,
            };
        });
    }, [marketDoc]);

    return {
        indices: displayIndices,
    };
}
