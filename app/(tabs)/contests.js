import React from "react";
import { View, Text, ScrollView } from "react-native";
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

const fallbackContests = [
    {
        id: "contest-1",
        title: "대학생 ESG 콘텐츠 공모전",
        organizer: "FINE NEWS",
        end_date: new Date(Date.now() + 86400000 * 12).toISOString(),
        views: 1280,
        image_url: null,
    },
    {
        id: "contest-2",
        title: "핀테크 아이디어 챌린지",
        organizer: "핀테크 협회",
        end_date: new Date(Date.now() + 86400000 * 25).toISOString(),
        views: 980,
        image_url: null,
    },
];

export default function ContestsTab() {
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

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="px-4 py-4 border-b border-gray-100">
                <StyledText className="text-xl font-bold text-gray-900 mb-1">공모전 & 대외활동</StyledText>
                <StyledText className="text-sm text-gray-500">마감 임박 순으로 정리했어요</StyledText>
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
                ) : (
                    displayContests.map((contest) => <ContestCard key={contest.id} contest={contest} />)
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
