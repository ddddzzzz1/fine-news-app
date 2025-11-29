import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ContestCard from "../../components/ContestCard";
import { Skeleton } from "../../components/ui/skeleton";
import { useAdminClaims } from "../../hooks/useAdminClaims";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

const CATEGORY_LABELS = {
    activity: "대외활동",
    job: "취업",
};

const CATEGORY_KEYS = ["activity", "job"];

const FOCUS_FILTERS = [
    { key: "all", label: "전체" },
    { key: "urgent", label: "🔥 마감 임박" },
    { key: "it", label: "IT/개발" },
    { key: "marketing", label: "마케팅" },
    { key: "design", label: "디자인" },
    { key: "volunteer", label: "봉사활동" },
];

const FOCUS_KEYWORDS = {
    it: ["개발", "it", "ai", "데이터", "엔지니어", "소프트웨어", "tech"],
    marketing: ["마케팅", "브랜드", "광고", "홍보", "pr", "콘텐츠"],
    design: ["디자인", "ux", "ui", "그래픽", "브랜딩", "아트"],
    volunteer: ["봉사", "서포터즈", "홍보대사", "대사", "리포터", "캠퍼스"],
};

const normalizeCategoryKey = (value) => {
    if (!value) return CATEGORY_KEYS[0];
    if (CATEGORY_KEYS.includes(value)) return value;
    const matchedKey = CATEGORY_KEYS.find((key) => CATEGORY_LABELS[key] === value);
    return matchedKey || CATEGORY_KEYS[0];
};

const getDaysUntilDeadline = (endDate) => {
    if (!endDate) return null;
    const deadline = new Date(endDate);
    if (Number.isNaN(deadline.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
};

const matchesFocus = (contest, focusKey) => {
    if (focusKey === "all") return true;
    if (focusKey === "urgent") {
        const daysUntil = getDaysUntilDeadline(contest.end_date);
        return typeof daysUntil === "number" && daysUntil >= 0 && daysUntil <= 7;
    }

    const keywords = FOCUS_KEYWORDS[focusKey];
    if (!keywords?.length) return true;
    const haystack = `${contest.title ?? ""} ${contest.organizer ?? ""} ${contest.description ?? ""}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
};

const LoadingMasonryPlaceholder = () => (
    <StyledView className="flex-row flex-wrap justify-between">
        {Array.from({ length: 4 }).map((_, index) => (
            <StyledView key={`contest-skeleton-${index}`} className="mb-5 w-[48%]">
                <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
                <Skeleton className="mt-3 h-3 w-3/4 rounded-full" />
                <Skeleton className="mt-2 h-3 w-1/2 rounded-full" />
            </StyledView>
        ))}
    </StyledView>
);

export default function ContestsTab() {
    const categories = CATEGORY_KEYS;
    const [activeCategory, setActiveCategory] = useState(categories[0]);
    const [activeFocus, setActiveFocus] = useState(FOCUS_FILTERS[0].key);
    const { isAdmin } = useAdminClaims();
    const router = useRouter();

    const { data: contests = [], isLoading } = useQuery({
        queryKey: ["contests"],
        queryFn: async () => {
            try {
                const q = query(collection(db, "contests"), orderBy("end_date", "asc"), limit(50));
                const snapshot = await getDocs(q);
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.log("Error fetching contests", error);
                return [];
            }
        },
        initialData: [],
    });

    const filteredContests = useMemo(() => {
        return contests
            .filter((contest) => normalizeCategoryKey(contest.category) === activeCategory)
            .filter((contest) => matchesFocus(contest, activeFocus));
    }, [contests, activeCategory, activeFocus]);

    const renderContestCard = ({ item }) => (
        <StyledView className="flex-1 mb-5">
            <ContestCard contest={item} />
        </StyledView>
    );

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
            <StyledView className="border-b border-gray-100 bg-white px-4 py-4">
                <StyledView className="mb-1 flex-row items-center justify-between">
                    <StyledText className="text-xl font-bold text-gray-900">대외활동 · 취업</StyledText>
                    {isAdmin && (
                        <StyledTouchableOpacity
                            className="mr-2 h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white"
                            onPress={() => router.push("/contest/manual-add")}
                        >
                            <Plus size={18} color="#111827" />
                        </StyledTouchableOpacity>
                    )}
                </StyledView>
                <StyledText className="text-sm text-gray-500">마감 임박 순으로 둘러보세요</StyledText>
                <StyledView className="mt-4 flex-row border-b border-gray-200">
                    {categories.map((category) => (
                        <StyledTouchableOpacity
                            key={category}
                            onPress={() => setActiveCategory(category)}
                            className={`flex-1 items-center py-2 ${
                                activeCategory === category ? "border-b-2 border-indigo-600" : "border-b-2 border-transparent"
                            }`}
                        >
                            <StyledText
                                className={`text-sm font-medium ${
                                    activeCategory === category ? "text-indigo-600" : "text-gray-500"
                                }`}
                            >
                                {CATEGORY_LABELS[category]}
                            </StyledText>
                        </StyledTouchableOpacity>
                    ))}
                </StyledView>
            </StyledView>

            <StyledView className="flex-1 bg-gray-50">
                <StyledView className="border-b border-gray-100 px-4 py-3">
                    <StyledScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
                        <StyledView className="flex-row items-center space-x-3">
                            {FOCUS_FILTERS.map((filter) => (
                                <StyledTouchableOpacity
                                    key={filter.key}
                                    onPress={() => setActiveFocus(filter.key)}
                                    className={`rounded-full border px-4 py-2 ${
                                        activeFocus === filter.key
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-gray-200 bg-white"
                                    }`}
                                >
                                    <StyledText
                                        className={`text-sm font-medium ${
                                            activeFocus === filter.key ? "text-indigo-600" : "text-gray-600"
                                        }`}
                                    >
                                        {filter.label}
                                    </StyledText>
                                </StyledTouchableOpacity>
                            ))}
                        </StyledView>
                    </StyledScrollView>
                </StyledView>

                {isLoading ? (
                    <StyledView className="px-4 py-5">
                        <LoadingMasonryPlaceholder />
                    </StyledView>
                ) : (
                    <FlatList
                        data={filteredContests}
                        renderItem={renderContestCard}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
                        columnWrapperStyle={{ columnGap: 16 }}
                        ListEmptyComponent={
                            <StyledView className="items-center py-12">
                                <StyledText className="text-sm text-gray-500">선택한 조건에 맞는 공고가 없습니다.</StyledText>
                            </StyledView>
                        }
                    />
                )}
            </StyledView>
        </StyledSafeAreaView>
    );
}
