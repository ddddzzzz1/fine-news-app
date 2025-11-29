import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search as SearchIcon, X, AlertCircle } from "lucide-react-native";
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useDebouncedValue } from "../lib/useDebounce";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

const SEARCH_TABS = [
    { id: "news", label: "뉴스", collection: "news_drafts" },
    { id: "newsletters", label: "뉴스레터", collection: "newsletters" },
    { id: "community_posts", label: "커뮤니티", collection: "community_posts" },
    { id: "contests", label: "공모전", collection: "contests" },
];

const ROUTE_MAP = {
    news: "/news",
    newsletters: "/newsletters",
    community_posts: "/community",
    contests: "/contest",
};

const TYPE_LABEL = {
    news: "뉴스",
    newsletters: "뉴스레터",
    community_posts: "커뮤니티",
    contests: "공모전",
};

const createEmptyResults = () =>
    SEARCH_TABS.reduce((acc, tab) => {
        acc[tab.id] = [];
        return acc;
    }, {});

const stripHtml = (value = "") =>
    value
        .replace(/<\/?em>/g, "")
        .replace(/<\/?mark>/g, "")
        .replace(/<[^>]*>/g, "");

const buildSnippet = (item) => {
    // news_drafts uses 'content_text' or 'summary'
    // other collections use 'content' or 'description'
    const content = item.content_text || item.summary || item.content || item.description || "";
    const clean = stripHtml(content).trim();
    if (!clean) return "";
    return clean.length > 100 ? `${clean.slice(0, 97)}…` : clean;
};

const buildMeta = (type, item) => {
    switch (type) {
        case "community_posts":
            return [item.board_type, item.university].filter(Boolean).join(" · ");
        case "contests":
            return [item.category || "공모전", item.organizer].filter(Boolean).join(" · ");
        case "newsletters":
            return [item.edition, item.published_date || item.created_date].filter(Boolean).join(" · ");
        default:
            return [item.source || "Fine News", item.published_date || item.created_date].filter(Boolean).join(" · ");
    }
};

async function runFirestoreSearch(queryText) {
    const trimmed = queryText.trim();
    if (!trimmed) {
        return createEmptyResults();
    }

    console.log("Firestore Search Query:", trimmed);

    const results = createEmptyResults();

    await Promise.all(
        SEARCH_TABS.map(async (tab) => {
            try {
                const collRef = collection(db, tab.collection);
                let q;

                if (tab.id === "news") {
                    // For news_drafts, we need to filter by state="published"
                    // AND perform the prefix search on title.
                    // This requires a composite index in Firestore: state (Asc) + title (Asc)
                    q = query(
                        collRef,
                        where("state", "==", "published"),
                        orderBy("title"),
                        startAt(trimmed),
                        endAt(trimmed + "\uf8ff"),
                        limit(20)
                    );
                } else {
                    q = query(
                        collRef,
                        orderBy("title"),
                        startAt(trimmed),
                        endAt(trimmed + "\uf8ff"),
                        limit(20)
                    );
                }

                const snapshot = await getDocs(q);
                console.log(`[${tab.id}] Found ${snapshot.size} docs`);
                results[tab.id] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    snippet: buildSnippet(doc.data()),
                }));
            } catch (error) {
                console.error(`Error searching collection ${tab.collection}:`, error);
                results[tab.id] = [];
            }
        })
    );

    return results;
}

import { Card } from "../components/ui/card";
import { TrendingUp, Tag, Calendar } from "lucide-react-native";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value.seconds) return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function SearchResultItem({ item, type }) {
    const hrefBase = ROUTE_MAP[type];
    if (!hrefBase || !item?.id) return null;
    const tagsArray = Array.isArray(item.tags) ? item.tags : [];

    // Format date
    const dateObj = toDate(item.published_date || item.created_date);
    const dateStr = dateObj ? format(dateObj, "M월 d일", { locale: ko }) : "";

    // Meta info (Source, etc.)
    const metaParts = [];
    if (type === "community_posts") {
        if (item.board_type) metaParts.push(item.board_type);
        if (item.university) metaParts.push(item.university);
    } else if (type === "contests") {
        if (item.category) metaParts.push(item.category);
        if (item.organizer) metaParts.push(item.organizer);
    } else {
        if (item.source) metaParts.push(item.source);
    }
    const metaText = metaParts.join(" · ");

    return (
        <Link href={`${hrefBase}/${item.id}`} asChild>
            <Pressable>
                <Card className="border border-gray-100 shadow-sm mb-3 bg-white rounded-xl p-4">
                    <StyledView className="flex-row items-center justify-between mb-2">
                        <StyledView className="flex-row items-center">
                            <StyledView className="bg-indigo-50 px-2 py-0.5 rounded mr-2">
                                <StyledText className="text-xs font-bold text-indigo-700">
                                    {TYPE_LABEL[type]}
                                </StyledText>
                            </StyledView>
                            {metaText ? (
                                <StyledText className="text-xs text-gray-500 font-medium mr-2">
                                    {metaText}
                                </StyledText>
                            ) : null}
                        </StyledView>
                        {dateStr ? (
                            <StyledText className="text-xs text-gray-400">
                                {dateStr}
                            </StyledText>
                        ) : null}
                    </StyledView>

                    <StyledText className="font-bold text-base text-gray-900 mb-2 leading-6" numberOfLines={2}>
                        {item.title || "제목 없음"}
                    </StyledText>

                    {item.snippet ? (
                        <StyledText className="text-sm text-gray-600 mb-3 leading-5" numberOfLines={2}>
                            {item.snippet}
                        </StyledText>
                    ) : null}

                    {tagsArray.length > 0 && (
                        <StyledView className="flex-row flex-wrap gap-1.5">
                            {tagsArray.slice(0, 3).map((tag, index) => (
                                <StyledView key={index} className="bg-gray-100 px-2 py-0.5 rounded flex-row items-center">
                                    <Tag size={10} color="#6b7280" style={{ marginRight: 3 }} />
                                    <StyledText className="text-[10px] text-gray-600">#{tag}</StyledText>
                                </StyledView>
                            ))}
                        </StyledView>
                    )}
                </Card>
            </Pressable>
        </Link>
    );
}

export default function GlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [activeTab, setActiveTab] = useState(SEARCH_TABS[0].id);
    const debouncedQuery = useDebouncedValue(query, 400);
    const trimmed = debouncedQuery.trim();
    const [emptyTemplate] = useState(createEmptyResults());

    const shouldRunSearch = trimmed.length >= 1;

    const { data = emptyTemplate, isFetching, isError, error } = useQuery({
        queryKey: ["firestore-search", trimmed],
        queryFn: () => runFirestoreSearch(trimmed),
        enabled: shouldRunSearch,
    });

    const results = data || emptyTemplate;
    const activeResults = results?.[activeTab] ?? [];

    const helperText = useMemo(() => {
        if (!trimmed.length) {
            return "검색어를 입력하면 뉴스 · 커뮤니티 · 공모전 결과를 한 번에 볼 수 있어요.";
        }
        return null;
    }, [trimmed]);

    return (
        <StyledSafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <StyledView className="px-4 pt-4 pb-2 border-b border-gray-100">
                <StyledView className="flex-row items-center space-x-2">
                    <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                        <ArrowLeft size={22} color="#111827" />
                    </Button>
                    <StyledView className="flex-1 relative">
                        <StyledView className="absolute left-3 top-3">
                            <SearchIcon size={16} color="#9ca3af" />
                        </StyledView>
                        <Input
                            value={query}
                            onChangeText={setQuery}
                            placeholder="뉴스 · 커뮤니티 · 공모전 검색"
                            autoFocus
                            returnKeyType="search"
                            className="pl-10 pr-10 bg-gray-50 border-0 rounded-full h-11"
                        />
                        {query.length ? (
                            <TouchableOpacity
                                onPress={() => setQuery("")}
                                className="absolute right-3 top-2.5 w-6 h-6 rounded-full bg-gray-200 items-center justify-center"
                            >
                                <X size={14} color="#374151" />
                            </TouchableOpacity>
                        ) : null}
                    </StyledView>
                </StyledView>
            </StyledView>

            <StyledView className="flex-row border-b border-gray-200 px-2">
                {SEARCH_TABS.map((tab) => {
                    const count = results?.[tab.id]?.length || 0;
                    return (
                        <StyledTouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab.id ? "border-indigo-600" : "border-transparent"}`}
                        >
                            <StyledText className={`text-sm font-medium ${activeTab === tab.id ? "text-indigo-600" : "text-gray-500"}`}>
                                {tab.label} {count > 0 && <StyledText className="text-xs text-indigo-500">({count})</StyledText>}
                            </StyledText>
                        </StyledTouchableOpacity>
                    );
                })}
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 32 }}>
                {helperText ? (
                    <StyledView className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6">
                        <StyledText className="text-sm text-gray-600 text-center">{helperText}</StyledText>
                    </StyledView>
                ) : isError ? (
                    <StyledView className="items-center justify-center py-10">
                        <AlertCircle size={48} color="#dc2626" />
                        <StyledText className="mt-3 text-sm text-gray-600 text-center">
                            검색 중 오류가 발생했습니다. {error?.message || "잠시 후 다시 시도해주세요."}
                        </StyledText>
                    </StyledView>
                ) : isFetching ? (
                    <StyledView className="py-10 items-center justify-center">
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <StyledText className="mt-3 text-sm text-gray-500">검색 중입니다...</StyledText>
                    </StyledView>
                ) : activeResults.length ? (
                    activeResults.map((item) => <SearchResultItem key={`${activeTab}-${item.id}`} item={item} type={activeTab} />)
                ) : (
                    <StyledView className="py-10 items-center px-4">
                        <StyledText className="text-sm text-gray-500 text-center mb-2">
                            검색 결과가 없습니다.
                        </StyledText>
                        <StyledText className="text-xs text-gray-400 text-center">
                            * 정확한 단어로 시작하는지 확인해주세요 (예: '삼성' O, '성전자' X)
                        </StyledText>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
