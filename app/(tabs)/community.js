import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Edit3 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
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
const StyledCategoryScrollView = styled(ScrollView);

const categories = ["전체", "인기글", "자유", "취업", "모집", "스터디"];
const POPULAR_LIKE_THRESHOLD = 5;

export default function CommunityTab() {
    const router = useRouter();
    const navigation = useNavigation();
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data: communityPosts, isLoading, isFetching, refetch } = useQuery({
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

    const refreshPosts = useCallback(async () => {
        if (isRefreshing || isFetching) return;
        setIsRefreshing(true);
        try {
            const result = await refetch();
            if (result?.error) {
                Alert.alert("오류", "게시글을 새로고침하지 못했어요. 잠시 후 다시 시도해 주세요.");
            }
        } catch (error) {
            console.log("Failed to refresh community posts", error);
            Alert.alert("오류", "게시글을 새로고침하지 못했어요. 잠시 후 다시 시도해 주세요.");
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing, isFetching, refetch]);

    useEffect(() => {
        const unsubscribe = navigation?.addListener?.("tabPress", () => {
            refreshPosts();
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [navigation, refreshPosts]);

    const filteredPosts = useMemo(() => {
        if (!communityPosts?.length) return [];

        if (selectedCategory === "전체") {
            return communityPosts;
        }

        if (selectedCategory === "인기글") {
            return communityPosts
                .filter((post) => {
                    const likeCount = post.like_count ?? post.liked_users?.length ?? 0;
                    return likeCount > POPULAR_LIKE_THRESHOLD;
                })
                .sort((a, b) => {
                    const aLikes = a.like_count ?? a.liked_users?.length ?? 0;
                    const bLikes = b.like_count ?? b.liked_users?.length ?? 0;
                    return bLikes - aLikes;
                });
        }

        return communityPosts.filter((post) => post.board_type === selectedCategory);
    }, [communityPosts, selectedCategory]);

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="px-4 py-4 border-b border-gray-100">
                <StyledView className="flex-row items-center justify-between">
                    <StyledView>
                        <StyledText className="text-xl font-bold text-gray-900">커뮤니티</StyledText>
                        <StyledText className="text-sm text-gray-500 mt-1">인기글부터 관심 주제까지 확인해보세요</StyledText>
                    </StyledView>
                    <StyledTouchableOpacity
                        onPress={refreshPosts}
                        disabled={isRefreshing || isFetching}
                        className="px-3 py-1.5 rounded-full border border-gray-200"
                    >
                        <StyledText className="text-sm text-gray-700">
                            {isRefreshing || isFetching ? "새로고치는 중..." : "새로고침"}
                        </StyledText>
                    </StyledTouchableOpacity>
                </StyledView>
                <StyledCategoryScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-4"
                    contentContainerStyle={{ paddingRight: 16 }}
                >
                    <StyledView className="flex-row space-x-2">
                        {categories.map((category) => (
                            <StyledTouchableOpacity
                                key={category}
                                onPress={() => {
                                    setSelectedCategory(category);
                                    refreshPosts();
                                }}
                                className={`px-4 py-2 rounded-full border ${
                                    selectedCategory === category ? "bg-indigo-600 border-indigo-600" : "border-gray-200"
                                }`}
                            >
                                <StyledText
                                    className={`text-sm ${
                                        selectedCategory === category ? "text-white" : "text-gray-700"
                                    }`}
                                >
                                    {category}
                                </StyledText>
                            </StyledTouchableOpacity>
                        ))}
                    </StyledView>
                </StyledCategoryScrollView>
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
                        <>
                            {filteredPosts.length === 0 ? (
                                <StyledView className="py-8 items-center">
                                    <StyledText className="text-sm text-gray-500">선택한 카테고리에 게시글이 없어요</StyledText>
                                </StyledView>
                            ) : (
                                filteredPosts.map((post) => (
                                    <CommunityPostCard key={post.id} post={post} showImagePreview={false} disableLike />
                                ))
                            )}
                        </>
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
