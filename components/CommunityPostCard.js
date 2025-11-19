import React from 'react';
import { Link } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { Card } from './ui/card';
import { MessageCircle, Eye } from 'lucide-react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function CommunityPostCard({ post }) {
    return (
        <Link href={`/community/${post.id}`} asChild>
            <Pressable>
                <Card className="p-4 border-0 border-b border-gray-100 rounded-none">
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
                            {format(new Date(post.created_date), 'yy.MM.dd', { locale: ko })}
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
                </Card>
            </Pressable>
        </Link>
    );
}
