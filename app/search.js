import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search as SearchIcon, X, AlertCircle } from "lucide-react-native";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useDebouncedValue } from "../lib/useDebounce";
import { getAlgoliaClient, getAlgoliaIndexName, isAlgoliaConfigured } from "../lib/searchClient";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

const SEARCH_TABS = [
    { id: "news", label: "뉴스" },
    { id: "newsletters", label: "뉴스레터" },
    { id: "community_posts", label: "커뮤니티" },
    { id: "contests", label: "공모전" },
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

const buildSnippet = (hit) => {
    const highlighted =
        hit?._snippetResult?.content?.value ??
        hit?._highlightResult?.content?.value ??
        hit?.content ??
        "";
    const clean = stripHtml(highlighted).trim();
    if (!clean) return "";
    return clean.length > 180 ? `${clean.slice(0, 177)}…` : clean;
};

const buildMeta = (type, hit) => {
    switch (type) {
        case "community_posts":
            return [hit.board_type, hit.university].filter(Boolean).join(" · ");
        case "contests":
            return [hit.category || "공모전", hit.organizer].filter(Boolean).join(" · ");
        case "newsletters":
            return [hit.edition, hit.published_date || hit.created_date].filter(Boolean).join(" · ");
        default:
            return [hit.source || "Fine News", hit.published_date || hit.created_date].filter(Boolean).join(" · ");
    }
};

async function runAlgoliaSearch(client, queryText) {
    if (!client) {
        return createEmptyResults();
    }
    const trimmed = queryText.trim();
    if (!trimmed) {
        return createEmptyResults();
    }

    const paramsString = (params) =>
        Object.entries(params)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return `${encodeURIComponent(key)}=${encodeURIComponent(value.join(","))}`;
                }
                return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join("&");

    const requests = SEARCH_TABS.map((tab) => ({
        indexName: getAlgoliaIndexName(tab.id),
        params: paramsString({
            query: trimmed,
            hitsPerPage: 20,
            attributesToRetrieve: "title,content,tags,category,board_type,organizer,university,source,edition,published_date,created_date",
            attributesToSnippet: "content:32",
            highlightPreTag: "<em>",
            highlightPostTag: "</em>",
        }),
    }));

    const { results } = await client.search({ requests });

    return SEARCH_TABS.reduce((acc, tab, index) => {
        const hits = results?.[index]?.hits ?? [];
        acc[tab.id] = hits.map((hit) => ({
            ...hit,
            id: hit.objectID || hit.id,
            snippet: buildSnippet(hit),
        }));
        return acc;
    }, {});
}

function SearchResultItem({ item, type }) {
    const hrefBase = ROUTE_MAP[type];
    if (!hrefBase || !item?.id) return null;
    const tagsArray = Array.isArray(item.tags) ? item.tags : [];
    const meta = buildMeta(type, item);

    return (
        <Link href={`${hrefBase}/${item.id}`} asChild>
            <Pressable className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow">
                <StyledText className="text-xs font-semibold text-indigo-600 mb-1">
                    {TYPE_LABEL[type] || "검색결과"}
                </StyledText>
                <StyledText className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                    {item.title || "제목 없음"}
                </StyledText>
                {meta ? (
                    <StyledText className="text-xs text-gray-500 mb-2" numberOfLines={1}>
                        {meta}
                    </StyledText>
                ) : null}
                {item.snippet ? (
                    <StyledText className="text-sm text-gray-600 mb-3" numberOfLines={3}>
                        {item.snippet}
                    </StyledText>
                ) : null}
                {!!tagsArray.length && (
                    <StyledView className="flex-row flex-wrap -m-1">
                        {tagsArray.slice(0, 3).map((tag) => (
                            <StyledView key={tag} className="m-1 rounded-full bg-indigo-50 px-3 py-1">
                                <StyledText className="text-xs font-medium text-indigo-700">#{tag}</StyledText>
                            </StyledView>
                        ))}
                    </StyledView>
                )}
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

    const algoliaClient = getAlgoliaClient();
    const searchReady = isAlgoliaConfigured() && Boolean(algoliaClient);
    const shouldRunSearch = searchReady && trimmed.length >= 2;

    const { data = emptyTemplate, isFetching, isError, error } = useQuery({
        queryKey: ["algolia-search", trimmed],
        queryFn: () => runAlgoliaSearch(algoliaClient, trimmed),
        enabled: shouldRunSearch,
    });

    const results = data || emptyTemplate;
    const activeResults = results?.[activeTab] ?? [];

    const helperText = useMemo(() => {
        if (!searchReady) {
            return "Algolia 설정이 비어 있습니다. app.json 의 extra.algolia 를 채우고 다시 시도하세요.";
        }
        if (!trimmed.length) {
            return "2자 이상 검색어를 입력하면 뉴스 · 커뮤니티 · 공모전 결과를 한 번에 볼 수 있어요.";
        }
        if (trimmed.length < 2) {
            return "검색어는 최소 2자 이상 입력해주세요.";
        }
        return null;
    }, [searchReady, trimmed]);

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
                {SEARCH_TABS.map((tab) => (
                    <StyledTouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab.id ? "border-indigo-600" : "border-transparent"}`}
                    >
                        <StyledText className={`text-sm font-medium ${activeTab === tab.id ? "text-indigo-600" : "text-gray-500"}`}>
                            {tab.label}
                        </StyledText>
                    </StyledTouchableOpacity>
                ))}
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
                    <StyledView className="py-10 items-center">
                        <StyledText className="text-sm text-gray-500">
                            검색 결과가 없습니다. 다른 키워드로 시도해보세요.
                        </StyledText>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
