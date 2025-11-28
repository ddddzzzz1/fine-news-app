import React from "react";
import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { Card } from "./ui/card";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { styled } from "nativewind";
import { Tag } from "lucide-react-native";

const StyledView = styled(View);
const StyledText = styled(Text);

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
    const tags = Array.isArray(news.tags) ? news.tags.slice(0, 3) : [];

    return (
        <Link href={`/news/${news.id}`} asChild>
            <Pressable>
                <Card className="border border-gray-100 shadow-sm mb-3 bg-white rounded-xl p-5">
                    {/* Header: State & Date */}
                    <StyledView className="flex-row items-center justify-between mb-3">
                        <StyledView className="flex-row items-center space-x-2">
                            {news.state === 'pending' && (
                                <StyledView className="bg-yellow-100 px-2 py-0.5 rounded mr-2">
                                    <StyledText className="text-xs font-bold text-yellow-800">검토 중</StyledText>
                                </StyledView>
                            )}
                            <StyledText className="text-xs text-gray-400 font-medium">
                                {displayDate ? format(displayDate, "M월 d일 HH:mm", { locale: ko }) : "날짜 미정"}
                            </StyledText>
                        </StyledView>
                    </StyledView>

                    {/* Title */}
                    <StyledText className="font-bold text-lg text-gray-900 mb-3 leading-7" numberOfLines={2}>
                        {news.title}
                    </StyledText>

                    {/* Summary (Optional) */}
                    {news.summary && (
                        <StyledText className="text-sm text-gray-600 mb-2 leading-5" numberOfLines={2}>
                            {news.summary}
                        </StyledText>
                    )}

                    {/* Footer: Tags */}
                    {tags.length > 0 && (
                        <StyledView className="flex-row flex-wrap gap-2 mt-1">
                            {tags.map((tag, index) => (
                                <StyledView key={index} className="bg-gray-100 px-2.5 py-1 rounded-md flex-row items-center">
                                    <Tag size={10} color="#6b7280" style={{ marginRight: 4 }} />
                                    <StyledText className="text-xs text-gray-600">{tag}</StyledText>
                                </StyledView>
                            ))}
                        </StyledView>
                    )}
                </Card>
            </Pressable>
        </Link>
    );
}
