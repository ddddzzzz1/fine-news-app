import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
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

const normalizeCategoryKey = (value) => {
    if (!value) return CATEGORY_KEYS[0];
    if (CATEGORY_KEYS.includes(value)) return value;
    const matchedKey = CATEGORY_KEYS.find((key) => CATEGORY_LABELS[key] === value);
    return matchedKey || CATEGORY_KEYS[0];
};

export default function ContestsTab() {
    const categories = CATEGORY_KEYS;
    const [activeCategory, setActiveCategory] = useState(categories[0]);
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
        return contests.filter((contest) => normalizeCategoryKey(contest.category) === activeCategory);
    }, [contests, activeCategory]);

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="px-4 py-4 border-b border-gray-100">
                <StyledView className="flex-row items-center justify-between mb-1">
                    <StyledText className="text-xl font-bold text-gray-900">대외활동 · 취업</StyledText>
                    {isAdmin && (
                        <StyledTouchableOpacity
                            className="h-9 w-9 rounded-full border border-gray-200 items-center justify-center bg-white mr-2"
                            onPress={() => router.push("/contest/manual-add")}
                        >
                            <Plus size={18} color="#111827" />
                        </StyledTouchableOpacity>
                    )}
                </StyledView>
                <StyledText className="text-sm text-gray-500">마감 임박 순으로 둘러보세요</StyledText>
                <StyledView className="flex-row mt-4 border-b border-gray-200">
                    {categories.map((category) => (
                        <StyledTouchableOpacity
                            key={category}
                            onPress={() => setActiveCategory(category)}
                            className={`flex-1 py-2 items-center ${
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

            <StyledScrollView className="flex-1 px-4 py-4">
                {isLoading ? (
                    <StyledView className="space-y-3">
                        {Array(4)
                            .fill(0)
                            .map((_, i) => (
                                <StyledView key={i} className="space-y-2">
                                    <Skeleton className="aspect-[4/5] w-full rounded-lg" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/3" />
                                </StyledView>
                            ))}
                    </StyledView>
                ) : filteredContests.length ? (
                    filteredContests.map((contest) => <ContestCard key={contest.id} contest={contest} />)
                ) : (
                    <StyledView className="py-10 items-center">
                        <StyledText className="text-sm text-gray-500">선택한 카테고리에 해당하는 공고가 없습니다.</StyledText>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
