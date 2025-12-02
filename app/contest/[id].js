import React from "react";
import { View, Text, Image, ScrollView, Linking, Alert, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { ArrowLeft } from "lucide-react-native";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import RichContentSection from "../../components/RichContentSection";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function ContestDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const { width } = useWindowDimensions();
    const contentWidth = Math.max(width - 48, 0);

    const { data: contest, isLoading } = useQuery({
        queryKey: ["contest-detail", id],
        queryFn: async () => {
            if (!id) return null;
            const ref = doc(db, "contest_details", id);
            const snap = await getDoc(ref);
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        },
        enabled: !!id,
    });

    const resolveDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) return date;
        if (typeof date?.toDate === 'function') return date.toDate();
        if (typeof date === 'string') return new Date(date);
        if (typeof date === 'number') return new Date(date);
        return new Date(date);
    };

    const handleSaveContest = async () => {
        if (!contest || !id) return;
        if (!userId) {
            Alert.alert("로그인 필요", "관심 공모전을 저장하려면 로그인해주세요.", [
                { text: "취소", style: "cancel" },
                { text: "로그인", onPress: () => router.push("/login") },
            ]);
            return;
        }
        try {
            await setDoc(doc(db, "saved_contests", `${userId}_${id}`), {
                contest_id: id,
                user_id: userId,
                title: contest.title,
                organizer: contest.organizer,
                start_date: contest.start_date || null,
                end_date: contest.end_date || null,
                image_url: contest.image_url || "",
                apply_url: contest.apply_url || "",
                saved_at: Timestamp.fromDate(new Date()),
            });

            if (contest.end_date) {
                const endDate = resolveDate(contest.end_date);
                if (endDate && !isNaN(endDate.getTime())) {
                    await setDoc(doc(db, "calendar_events", `saved-${userId}-${id}`), {
                        title: `[관심] ${contest.title}`,
                        description: "",
                        date: Timestamp.fromDate(endDate),
                        category: "마이",
                        is_personal: true,
                        user_id: userId,
                        created_by: currentUser?.email || "",
                    });
                }
            }

            Alert.alert("관심 공모전 추가", "캘린더와 프로필에서 확인할 수 있습니다.");
        } catch (error) {
            console.log("Error saving contest", error);
            Alert.alert("저장 실패", "다시 시도해주세요.");
        }
    };

    if (isLoading) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white items-center justify-center">
                <StyledText className="text-sm text-gray-500">공모전 정보를 불러오는 중입니다...</StyledText>
            </StyledSafeAreaView>
        );
    }

    if (!contest) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white items-center justify-center">
                <StyledText className="text-sm text-gray-500">공모전 정보를 찾을 수 없습니다.</StyledText>
                <Button className="mt-4" onPress={() => router.back()}>
                    돌아가기
                </Button>
            </StyledSafeAreaView>
        );
    }

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="font-semibold text-sm text-gray-900">공모전 상세</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4">
                <StyledText className="text-xl font-bold text-gray-900 mb-4">{contest.title}</StyledText>
                {contest.image_url && (
                    <StyledImage
                        source={{ uri: contest.image_url }}
                        className="w-full aspect-[3/4] rounded-xl mb-4"
                        resizeMode="cover"
                    />
                )}

                <StyledView className="mb-4 space-y-1">
                    <StyledText className="text-sm text-gray-500">주최</StyledText>
                    <StyledText className="text-base font-medium text-gray-900">{contest.organizer}</StyledText>
                </StyledView>

                {contest.end_date && (
                    <StyledView className="mb-4 space-y-1">
                        <StyledText className="text-sm text-gray-500">모집 기간</StyledText>
                        <StyledText className="text-base font-medium text-gray-900">
                            {contest.start_date
                                ? `${safeFormatDate(contest.start_date)} - ${safeFormatDate(contest.end_date)}`
                                : safeFormatDate(contest.end_date)}
                        </StyledText>
                    </StyledView>
                )}

                <RichContentSection label="소개" value={contest.description} contentWidth={contentWidth} />
                <RichContentSection label="지원 자격" value={contest.requirements} contentWidth={contentWidth} />
                <RichContentSection label="혜택" value={contest.benefits} contentWidth={contentWidth} />

                <StyledView className="flex-row space-x-3 mt-4">
                    <Button
                        className="flex-1 rounded-full h-12 bg-indigo-50 border border-indigo-200"
                        onPress={handleSaveContest}
                    >
                        <StyledText className="text-indigo-700 font-semibold">관심 공모전 추가</StyledText>
                    </Button>
                    {contest.apply_url && (
                        <Button
                            className="flex-1 rounded-full h-12 bg-indigo-600"
                            onPress={() => Linking.openURL(contest.apply_url)}
                        >
                            지원 페이지로 이동
                        </Button>
                    )}
                </StyledView>
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}

function safeFormatDate(value) {
    if (!value) return "날짜 미정";
    const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
    if (isNaN(date.getTime())) return "날짜 미정";
    try {
        return format(date, "yyyy.MM.dd", { locale: ko });
    } catch (e) {
        return "날짜 미정";
    }
}
