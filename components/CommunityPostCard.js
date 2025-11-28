import React, { useState } from "react";
import { Link } from "expo-router";
import { View, Text, Pressable, TouchableOpacity, Image, Alert } from "react-native";
import { Card } from "./ui/card";
import { MessageCircle, Heart } from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { styled } from "nativewind";
import { db, auth } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);
const POPULAR_LIKE_THRESHOLD = 5;

export default function CommunityPostCard({ post, showImagePreview = true, disableLike = false }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [liking, setLiking] = useState(false);
    const userId = auth.currentUser?.uid;
    const isAuthenticated = Boolean(userId);

    const likedUsers = post?.liked_users || [];
    const likeCount = post?.like_count ?? likedUsers.length ?? 0;
    const hasLiked = isAuthenticated ? likedUsers.includes(userId) : false;

    const getCreatedDate = () => {
        if (!post?.created_date) return null;
        if (post.created_date.seconds) {
            return new Date(post.created_date.seconds * 1000);
        }
        return new Date(post.created_date);
    };

    const createdDate = getCreatedDate();

    const handleLike = async () => {
        if (!post?.id || liking) return;
        if (!isAuthenticated) {
            Alert.alert("로그인이 필요해요", "좋아요를 누르려면 로그인해주세요.", [
                { text: "취소", style: "cancel" },
                { text: "로그인", onPress: () => router.push("/login") },
            ]);
            return;
        }
        setLiking(true);
        try {
            const ref = doc(db, "community_posts", post.id);
            if (hasLiked) {
                await updateDoc(ref, {
                    liked_users: arrayRemove(userId),
                    like_count: increment(-1),
                });
            } else {
                await updateDoc(ref, {
                    liked_users: arrayUnion(userId),
                    like_count: increment(1),
                });
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["tab-community-posts"] }),
                queryClient.invalidateQueries({ queryKey: ["community-post", post.id] }),
            ]);
        } catch (error) {
            console.log("Failed to update like", error);
        } finally {
            setLiking(false);
        }
    };

    const relativeTime = createdDate
        ? formatDistanceToNow(createdDate, { locale: ko, addSuffix: true })
        : "방금 전";
    const previewText = post?.content?.trim();
    const isPopular = likeCount >= POPULAR_LIKE_THRESHOLD;

    return (
        <Link href={`/community/${post.id}`} asChild>
            <Pressable>
                <Card className="p-4 border-0 border-b border-gray-100 rounded-none">
                    {showImagePreview && post.image_url && (
                        <StyledView className="relative">
                            <StyledImage
                                source={{ uri: post.image_url }}
                                className="w-full rounded-xl mb-3 bg-gray-100"
                                resizeMode="cover"
                                style={{
                                    aspectRatio:
                                        post.image_meta?.width && post.image_meta?.height
                                            ? post.image_meta.width / post.image_meta.height
                                            : 16 / 9,
                                }}
                            />
                            {post.images && post.images.length > 1 && (
                                <StyledView className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-md">
                                    <StyledText className="text-white text-xs font-bold">
                                        +{post.images.length - 1}
                                    </StyledText>
                                </StyledView>
                            )}
                        </StyledView>
                    )}
                    <StyledView className="mb-2">
                        <StyledView className="flex-row flex-wrap items-center mb-1">
                            <StyledText className="text-[11px] font-semibold text-indigo-600">
                                {post.board_type || "게시판"}
                            </StyledText>
                            <StyledView className="mx-1 h-1 w-1 rounded-full bg-gray-300" />
                            <StyledText className="text-xs text-gray-500">{post.university || "학교 미정"}</StyledText>
                            <StyledView className="mx-1 h-1 w-1 rounded-full bg-gray-300" />
                            <StyledText className="text-[11px] text-gray-400">{relativeTime}</StyledText>
                        </StyledView>
                        <StyledText className="font-semibold text-lg text-gray-900" numberOfLines={2}>
                            {post.title}
                        </StyledText>
                        {previewText ? (
                            <StyledText className="text-sm text-gray-600 mt-1" numberOfLines={2}>
                                {previewText}
                            </StyledText>
                        ) : null}
                    </StyledView>
                    <StyledView className="mt-3 flex-row items-center justify-between">
                        <StyledView className="flex-row items-center space-x-4">
                            <StyledView className="flex-row items-center space-x-1">
                                <MessageCircle size={16} color="#6b7280" />
                                <StyledText className="text-sm text-gray-600">
                                    {post.comment_count ?? post.comments?.length ?? 0}
                                </StyledText>
                            </StyledView>
                            {disableLike ? (
                                <StyledView className="flex-row items-center space-x-1 opacity-60">
                                    <Heart size={18} color="#6b7280" />
                                    <StyledText className="text-sm text-gray-600">{likeCount}</StyledText>
                                </StyledView>
                            ) : (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleLike();
                                    }}
                                    className="flex-row items-center space-x-1"
                                    disabled={liking}
                                >
                                    <Heart
                                        size={18}
                                        color={hasLiked ? "#ef4444" : "#6b7280"}
                                        fill={hasLiked ? "#ef4444" : "transparent"}
                                    />
                                    <StyledText className="text-sm text-gray-600">{likeCount}</StyledText>
                                </TouchableOpacity>
                            )}
                        </StyledView>
                        {isPopular && <StyledText className="text-xs font-semibold text-indigo-500">인기글</StyledText>}
                    </StyledView>
                </Card>
            </Pressable>
        </Link>
    );
}
