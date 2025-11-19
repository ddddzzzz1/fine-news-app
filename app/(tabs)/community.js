import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Edit3 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import CommunityPostCard from "../../components/CommunityPostCard";
import { Skeleton } from "../../components/ui/skeleton";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function CommunityTab() {
    const router = useRouter();

    const { data: communityPosts, isLoading } = useQuery({
        queryKey: ["tab-community-posts"],
        queryFn: async () => {
            try {
                const q = query(collection(db, "community_posts"), orderBy("created_date", "desc"), limit(50));
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.log("Error fetching community posts", e);
                return [];
            }
        },
        initialData: [],
    });

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="px-4 py-4 border-b border-gray-100">
                <StyledText className="text-xl font-bold text-gray-900">커뮤니티</StyledText>
                <StyledText className="text-sm text-gray-500 mt-1">실시간 인기 게시글을 확인하세요</StyledText>
            </StyledView>

            <StyledScrollView className="flex-1 px-4">
                <StyledView className="py-4">
                    {isLoading ? (
                        <StyledView className="space-y-2">
                            {Array(8)
                                .fill(0)
                                .map((_, i) => (
                                    <StyledView key={i} className="p-4 border border-gray-200 rounded-lg mb-2">
                                        <Skeleton className="h-4 w-32 mb-2" />
                                        <Skeleton className="h-5 w-full mb-2" />
                                        <Skeleton className="h-3 w-20" />
                                    </StyledView>
                                ))}
                        </StyledView>
                    ) : (
                        communityPosts.map((post) => <CommunityPostCard key={post.id} post={post} />)
                    )}
                </StyledView>
            </StyledScrollView>

            <StyledTouchableOpacity
                onPress={() => router.push("/write-post")}
                className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 items-center justify-center shadow-lg"
            >
                <Edit3 size={24} color="white" />
            </StyledTouchableOpacity>
        </StyledSafeAreaView>
    );
}
