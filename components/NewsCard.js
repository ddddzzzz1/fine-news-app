import React from 'react';
import { Link } from 'expo-router';
import { View, Text, Image, Pressable } from 'react-native';
import { Card } from './ui/card';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function NewsCard({ news }) {
    return (
        <Link href={`/news/${news.id}`} asChild>
            <Pressable>
                <Card className="overflow-hidden border-0 shadow-sm mb-3">
                    {news.image_url && (
                        <StyledView className="aspect-video w-full bg-gray-100 overflow-hidden">
                            <StyledImage
                                source={{ uri: news.image_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </StyledView>
                    )}
                    <StyledView className="p-4">
                        <StyledText className="font-bold text-base text-gray-900 mb-2" numberOfLines={2}>
                            {news.title}
                        </StyledText>
                        <StyledView className="flex-row items-center justify-between">
                            <StyledText className="text-xs text-gray-500">{news.source || '파이낸셜뉴스'}</StyledText>
                            <StyledText className="text-xs text-gray-500">
                                {news.published_date
                                    ? format(new Date(news.published_date), 'MM월 dd일', { locale: ko })
                                    : format(new Date(news.created_date), 'MM월 dd일', { locale: ko })
                                }
                            </StyledText>
                        </StyledView>
                    </StyledView>
                </Card>
            </Pressable>
        </Link>
    );
}
