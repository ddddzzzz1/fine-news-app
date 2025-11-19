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
        title: "대학생 ESG 콘텐츠 공모전",
        organizer: "FINE NEWS",
        end_date: new Date(Date.now() + 86400000 * 12).toISOString(),
        views: 1280,
        image_url: null,
        category: "공모전",
        description: "ESG 주제로 콘텐츠를 제작하는 공모전입니다.",
        start_date: new Date().toISOString(),
        apply_url: "https://example.com/contest-1",
    },
    {
        id: "contest-2",
        title: "핀테크 아이디어 챌린지",
        organizer: "핀테크 협회",
        end_date: new Date(Date.now() + 86400000 * 25).toISOString(),
        views: 980,
        image_url: null,
        category: "대외활동",
        description: "핀테크 혁신 아이디어를 모집합니다.",
        start_date: new Date().toISOString(),
        apply_url: "https://example.com/contest-2",
    },
    {
        id: "contest-3",
        title: "스타트업 신입/인턴 채용",
        organizer: "Fine Startup",
        end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        views: 420,
        image_url: null,
        category: "신입/인턴",
        description: "스타트업에서 함께 성장할 인턴을 찾습니다.",
        start_date: new Date().toISOString(),
        apply_url: "https://example.com/contest-3",
    },
];

export default function ContestsTab() {
    const categories = ["공모전", "신입/인턴", "대외활동"];
    const [activeCategory, setActiveCategory] = useState("공모전");

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
        (contest) => (contest.category || "공모전") === activeCategory
    );

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="px-4 py-4 border-b border-gray-100">
                <StyledText className="text-xl font-bold text-gray-900 mb-1">공모전 & 대외활동</StyledText>
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
                        <StyledText className="text-sm text-gray-500">
                            선택한 카테고리에 해당하는 공모전이 없습니다.
                        </StyledText>
                    </StyledView>
                )}

                {!contests.length && (
                    <StyledView className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-100 mt-4">
                        <StyledText className="text-xs text-amber-700">
                            Firestore의 `contests` 컬렉션을 채우면 실제 공모전 정보가 표시됩니다.
                        </StyledText>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
