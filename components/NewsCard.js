import React from "react";
import { Link } from "expo-router";
import { View, Text, Image, Pressable } from "react-native";
import { Card } from "./ui/card";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") {
        return value.toDate();
    }
    if (value.seconds) {
        return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function NewsCard({ news }) {
    const displayDate = toDate(news.published_date) || toDate(news.created_date);

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
                                {displayDate ? format(displayDate, "MM월 dd일", { locale: ko }) : "날짜 미정"}
                            </StyledText>
                        </StyledView>
                    </StyledView>
                </Card>
            </Pressable>
        </Link>
    );
}
