import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react-native";
import CommunityPostCard from "../components/CommunityPostCard";
import { Skeleton } from "../components/ui/skeleton";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);

export default function MyPostsScreen() {
    const router = useRouter();
    const email = auth.currentUser?.email || "demo@example.com";

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ["my-posts", email],
        queryFn: async () => {
            if (!email) return [];
            try {
                const q = query(
                    collection(db, "community_posts"),
                    where("created_by", "==", email),
                    orderBy("created_date", "desc")
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.log("Error fetching my posts", error);
                return [];
            }
        },
        enabled: !!email,
        initialData: [],
    });

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="font-semibold text-sm text-gray-900">내 게시글</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4">
                {isLoading ? (
                    <StyledView className="space-y-2">
                        {Array(5)
                            .fill(0)
                            .map((_, i) => (
                                <StyledView key={i} className="p-4 border border-gray-200 rounded-lg mb-2">
                                    <Skeleton className="h-4 w-40 mb-2" />
                                    <Skeleton className="h-5 w-full mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                </StyledView>
                            ))}
                    </StyledView>
                ) : posts.length ? (
                    posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
                ) : (
                    <StyledView className="items-center py-20">
                        <StyledText className="text-sm text-gray-500">작성한 게시글이 없습니다.</StyledText>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
