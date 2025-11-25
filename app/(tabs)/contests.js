import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ContestCard from "../../components/ContestCard";
import { Skeleton } from "../../components/ui/skeleton";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

const fallbackContests = [
    {
        id: "contest-1",
        title: "대학생 ESG 콘텐츠 챌린지",
        organizer: "FINE NEWS",
        end_date: new Date(Date.now() + 86400000 * 12).toISOString(),
        image_url: null,
        category: "대외활동",
        description: "ESG 주제로 콘텐츠를 제작하고 멘토링을 받는 대외활동입니다.",
        start_date: new Date().toISOString(),
        apply_url: "https://example.com/contest-1",
    },
    {
        id: "contest-2",
        title: "스타트업 채용 부트캠프",
        organizer: "핀테크 협회",
        end_date: new Date(Date.now() + 86400000 * 25).toISOString(),
        image_url: null,
        category: "취업",
        description: "현직자 특강과 연계 채용이 포함된 취업 프로그램입니다.",
        start_date: new Date().toISOString(),
        apply_url: "https://example.com/contest-2",
    },
    {
        id: "contest-3",
        title: "PM 실무 자격증 집중 과정",
        organizer: "Fine Academy",
        end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        image_url: null,
        category: "자격증",
        description: "3주간 실무 과제를 수행하며 자격증을 준비합니다.",
        start_date: new Date().toISOString(),
        apply_url: "https://example.com/contest-3",
    },
];

export default function ContestsTab() {
    const categories = ["대외활동", "취업", "자격증"];
    const [activeCategory, setActiveCategory] = useState(categories[0]);

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

    const displayContests = contests.length ? contests : fallbackContests;
    const filteredContests = displayContests.filter(
        (contest) => (contest.category || categories[0]) === activeCategory
    );

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="px-4 py-4 border-b border-gray-100">
                <StyledText className="text-xl font-bold text-gray-900 mb-1">대외활동 · 취업 · 자격증</StyledText>
                <StyledText className="text-sm text-gray-500">마감 임박 순으로 정리했어요</StyledText>
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
                                {category}
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

                {!contests.length && (
                    <StyledView className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-100 mt-4">
                        <StyledText className="text-xs text-amber-700">
                            Firestore의 `contests` 컬렉션을 채우면 실제 공고 정보가 표시됩니다.
                        </StyledText>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
