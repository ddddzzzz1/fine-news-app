import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import ContestCard from "../components/ContestCard";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react-native";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);

export default function SavedContestsScreen() {
    const router = useRouter();
    const userId = auth.currentUser?.uid || "demo-user";

    const { data: savedContests = [], isLoading } = useQuery({
        queryKey: ["saved-contests", userId],
        queryFn: async () => {
            try {
                const q = query(collection(db, "saved_contests"), where("user_id", "==", userId));
                const snapshot = await getDocs(q);
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.log("Error fetching saved contests", error);
                return [];
            }
        },
    });

    const formattedContests = savedContests.map((contest) => ({
        ...contest,
        id: contest.contest_id || contest.id,
    }));

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="font-semibold text-sm text-gray-900">저장한 공고</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4">
                {isLoading ? (
                    <StyledText className="text-sm text-gray-500">저장한 공고를 불러오는 중입니다...</StyledText>
                ) : formattedContests.length ? (
                    formattedContests.map((contest) => <ContestCard key={contest.id} contest={contest} />)
                ) : (
                    <StyledView className="items-center py-20">
                        <StyledText className="text-sm text-gray-500">저장한 공고가 없습니다.</StyledText>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
