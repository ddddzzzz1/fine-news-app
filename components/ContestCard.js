import React, { useMemo } from "react";
import { Link } from "expo-router";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

const formatDeadline = (endDate) => {
    if (!endDate) return "";
    const date = new Date(endDate);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getMonth() + 1}월 ${date.getDate()}일 마감`;
};

const buildDDayMeta = (endDate) => {
    if (!endDate) return { label: "일정 미정", tone: "default" };
    const deadline = new Date(endDate);
    if (Number.isNaN(deadline.getTime())) return { label: "일정 미정", tone: "default" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    if (diff > 0) {
        return {
            label: `D-${diff}`,
            tone: diff <= 7 ? "urgent" : "default",
        };
    }
    if (diff === 0) {
        return { label: "D-Day", tone: "urgent" };
    }
    return { label: "마감", tone: "closed" };
};

export default function ContestCard({ contest }) {
    const posterSource = contest.image_url ? { uri: contest.image_url } : null;
    const deadlineCopy = useMemo(() => formatDeadline(contest.end_date), [contest.end_date]);
    const ddayMeta = useMemo(() => buildDDayMeta(contest.end_date), [contest.end_date]);

    const badgeClassName =
        ddayMeta.tone === "urgent"
            ? "bg-red-500/90"
            : ddayMeta.tone === "closed"
            ? "bg-gray-900/80"
            : "bg-black/50";

    return (
        <Link href={`/contest/${contest.id}`} asChild>
            <Pressable className="flex-1" accessibilityRole="button">
                <StyledView className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-slate-200">
                    {posterSource ? (
                        <StyledImage source={posterSource} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <LinearGradient
                            colors={["#f5d0fe", "#a5b4fc"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                        >
                            <StyledView className="flex-1 items-center justify-center px-4">
                                <StyledText className="text-center text-base font-bold text-white">
                                    {contest.title}
                                </StyledText>
                            </StyledView>
                        </LinearGradient>
                    )}

                    <LinearGradient
                        colors={["rgba(15,23,42,0)", "rgba(15,23,42,0.92)"]}
                        locations={[0, 0.9]}
                        style={[StyleSheet.absoluteFillObject, { top: "35%" }]}
                    />

                    <StyledView className={`absolute top-3 left-3 px-3 py-1 rounded-full ${badgeClassName}`}>
                        <StyledText className="text-xs font-bold text-white">{ddayMeta.label}</StyledText>
                    </StyledView>

                    <StyledView className="absolute top-3 right-3 bg-black/35 rounded-full p-1.5">
                        <Ionicons name="bookmark-outline" size={16} color="#fff" />
                    </StyledView>

                    <StyledView className="absolute bottom-0 left-0 right-0 p-4">
                        <StyledText className="text-[11px] font-medium text-white/80">
                            {contest.organizer ?? "주최 미정"}
                        </StyledText>
                        <StyledText className="mt-1 text-base font-semibold text-white leading-snug" numberOfLines={2}>
                            {contest.title}
                        </StyledText>
                        <StyledView className="mt-3 flex-row items-center">
                            <Ionicons name="calendar" size={14} color="#f8fafc" />
                            {!!deadlineCopy && (
                                <StyledText className="ml-1 text-[11px] text-white/85">{deadlineCopy}</StyledText>
                            )}
                        </StyledView>
                    </StyledView>
                </StyledView>
            </Pressable>
        </Link>
    );
}
