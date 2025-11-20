import React, { useState } from 'react';
import { Link } from 'expo-router';
import { View, Text, Pressable, TouchableOpacity, Image, Alert } from 'react-native';
import { Card } from './ui/card';
import { MessageCircle, Eye, Heart } from 'lucide-react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { styled } from 'nativewind';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function CommunityPostCard({ post }) {
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
            Alert.alert("로그인 필요", "좋아요를 누르려면 로그인해주세요.", [
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
                queryClient.invalidateQueries({ queryKey: ["home-community-posts"] }),
                queryClient.invalidateQueries({ queryKey: ["tab-community-posts"] }),
                queryClient.invalidateQueries({ queryKey: ["community-post", post.id] }),
            ]);
        } catch (error) {
            console.log("Failed to update like", error);
        } finally {
            setLiking(false);
        }
    };

    return (
        <Link href={`/community/${post.id}`} asChild>
            <Pressable>
                <Card className="p-4 border-0 border-b border-gray-100 rounded-none">
                    {post.image_url && (
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
                    )}
                    <StyledView className="mb-2">
                        <StyledView className="flex-row items-center space-x-2 mb-1">
                            <StyledText className="text-xs text-gray-500">{post.university}</StyledText>
                            <StyledText className="text-xs text-gray-400">|</StyledText>
                            <StyledText className="text-xs text-gray-500">{post.board_type}</StyledText>
                        </StyledView>
                        <StyledText className="font-semibold text-base text-gray-900" numberOfLines={1}>
                            {post.title}
                        </StyledText>
                    </StyledView>
                    <StyledView className="flex-row items-center justify-between">
                        <StyledText className="text-xs text-gray-500">
                            {createdDate ? format(createdDate, 'yy.MM.dd', { locale: ko }) : '날짜 미정'}
                        </StyledText>
                        <StyledView className="flex-row items-center space-x-3">
                            <StyledView className="flex-row items-center space-x-1">
                                <Eye size={12} color="#6b7280" />
                                <StyledText className="text-xs text-gray-500">{post.views || 0}</StyledText>
                            </StyledView>
                            <StyledView className="flex-row items-center space-x-1">
                                <MessageCircle size={12} color="#6b7280" />
                                <StyledText className="text-xs text-gray-500">{post.comment_count || 0}</StyledText>
                            </StyledView>
                        </StyledView>
                    </StyledView>
                    <StyledView className="mt-3 flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleLike();
                            }}
                            className="flex-row items-center space-x-1"
                            disabled={liking}
                        >
                            <Heart size={16} color={hasLiked ? "#ef4444" : "#6b7280"} fill={hasLiked ? "#ef4444" : "transparent"} />
                            <StyledText className="text-xs text-gray-700">{likeCount}</StyledText>
                        </TouchableOpacity>
                        <StyledText className="text-xs text-indigo-500">{likeCount > 5 ? "인기글" : ""}</StyledText>
                    </StyledView>
                </Card>
            </Pressable>
        </Link>
    );
}
