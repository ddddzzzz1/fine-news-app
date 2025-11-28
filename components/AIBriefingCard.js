import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { styled } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Sparkles } from "lucide-react-native";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const buildHighlights = (content = "") => {
    const normalized = content.replace(/\s+/g, " ").trim();
    if (!normalized) return [];
    const sentences = normalized.split(/(?<=[.?!])\s+/).filter(Boolean);
    return sentences.slice(0, 2);
};

const formatDisplayDate = (date) => {
    if (!date) return "";
    try {
        return format(date, "M월 d일 (EEE)", { locale: ko });
    } catch {
        return "";
    }
};

export default function AIBriefingCard({ content, createdAt = new Date() }) {
    const [expanded, setExpanded] = useState(false);
    const highlights = useMemo(() => buildHighlights(content), [content]);
    const displayDate = formatDisplayDate(createdAt);
    const fallbackExcerpt = useMemo(() => content?.trim() ?? "", [content]);
    const cardAnimation = useRef(new Animated.Value(0)).current;
    const detailProgress = useRef(new Animated.Value(0)).current;

    if (!content?.trim()) return null;

    useEffect(() => {
        Animated.timing(cardAnimation, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();
    }, [cardAnimation]);

    useEffect(() => {
        Animated.timing(detailProgress, {
            toValue: expanded ? 1 : 0,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [detailProgress, expanded]);

    const detailStyle = {
        opacity: detailProgress,
        transform: [
            {
                translateY: detailProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-6, 0],
                }),
            },
        ],
    };

    return (
        <StyledView className="px-4 mt-6">
            <LinearGradient
                colors={["rgba(167,139,250,0.3)", "rgba(59,130,246,0.18)", "rgba(236,72,153,0.12)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 28, padding: 1.5 }}
            >
                <BlurView intensity={45} tint="light" style={{ borderRadius: 26, overflow: "hidden" }}>
                    <Animated.View
                        style={{
                            opacity: cardAnimation,
                            transform: [
                                {
                                    translateY: cardAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [30, 0],
                                    }),
                                },
                                {
                                    scale: cardAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.95, 1],
                                    }),
                                },
                            ],
                        }}
                        className="bg-white/75 px-6 py-6 rounded-[26px]"
                    >
                        <StyledView className="flex-row items-center justify-between mb-5">
                            <StyledView className="flex-row items-center space-x-2">
                                <StyledView className="px-3 py-1.5 rounded-full bg-indigo-500/90">
                                    <StyledText className="text-white text-xs font-bold">AI 브리핑</StyledText>
                                </StyledView>
                                {!!displayDate && (
                                    <StyledText className="text-[11px] text-gray-500 font-medium">{displayDate}</StyledText>
                                )}
                            </StyledView>
                            <Sparkles size={20} color="#7c3aed" />
                        </StyledView>
                        <StyledText className="text-xl font-black text-gray-900 leading-snug mb-4">
                            오늘의 경제 임팩트 타임라인
                        </StyledText>

                        <StyledView className="space-y-2 mb-3">
                            {highlights.length
                                ? highlights.map((sentence, idx) => (
                                      <StyledText key={`${sentence}-${idx}`} className="text-[15px] text-gray-800 leading-7">
                                          <Text className="text-indigo-500 font-bold mr-1">•</Text>
                                          {sentence.trim()}
                                      </StyledText>
                                  ))
                                : (
                                    <StyledText className="text-sm text-gray-700 leading-7" numberOfLines={3}>
                                        {fallbackExcerpt}
                                    </StyledText>
                                )}
                        </StyledView>

                        {expanded && (
                            <Animated.View style={detailStyle}>
                                <StyledText className="text-sm text-gray-700 leading-7">
                                    {fallbackExcerpt}
                                </StyledText>
                            </Animated.View>
                        )}

                        <StyledTouchableOpacity
                            className="mt-4 flex-row items-center"
                            activeOpacity={0.8}
                            onPress={() => setExpanded((prev) => !prev)}
                        >
                            <StyledText className="text-sm font-semibold text-indigo-600 mr-1">
                                {expanded ? "간단히 보기" : "전체 내용 보기"}
                            </StyledText>
                            <StyledText className="text-base text-indigo-500">
                                {expanded ? "↑" : "↓"}
                            </StyledText>
                        </StyledTouchableOpacity>
                    </Animated.View>
                </BlurView>
            </LinearGradient>
            <StyledView className="absolute inset-0 -z-10 top-4 px-4">
                <StyledView className="h-32 rounded-full bg-indigo-500/20 blur-3xl" />
            </StyledView>
        </StyledView>
    );
}
