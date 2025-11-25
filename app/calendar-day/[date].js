import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, limit, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);

const fallbackEvents = [
    {
        id: "sample-1",
        title: "FOMC 회의 결과 발표",
        description: "미국 기준금리 방향을 확인하세요.",
        date: new Date().toISOString(),
        category: "경제",
    },
];

const categorySections = [
    { key: "마이", label: "마이 이벤트" },
    { key: "경제", label: "경제 이벤트" },
];

const normalizeCategory = (value) => (typeof value === "string" ? value.trim() : "");

const getEventCategory = (event) => {
    const normalized = normalizeCategory(event.category);
    if (event.is_personal || normalized === "마이") return "마이";
    return "경제";
};

const resolveEventDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === "function") return value.toDate();
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    if (typeof value === "object" && typeof value.seconds === "number") {
        const milliseconds = value.seconds * 1000 + (value.nanoseconds || 0) / 1_000_000;
        return new Date(milliseconds);
    }
    return new Date(value);
};

export default function DayEventsScreen() {
    const router = useRouter();
    const { date } = useLocalSearchParams();
    const selectedDate = date ? new Date(date) : new Date();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState(null);

    const { data: events = [], isLoading } = useQuery({
        queryKey: ["calendar-events"],
        queryFn: async () => {
            try {
                const q = query(collection(db, "calendar_events"), orderBy("date", "asc"), limit(100));
                const snapshot = await getDocs(q);
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.log("Error fetching calendar events", error);
                return [];
            }
        },
        initialData: [],
    });

    const eventsForDay = useMemo(() => {
        const source = events.length ? events : fallbackEvents;
        return source.filter((event) => {
            const eventDate = resolveEventDate(event.date);
            if (!eventDate || !isSameDay(eventDate, selectedDate)) return false;
            if (event.is_personal && event.user_id && event.user_id !== userId) return false;
            return true;
        });
    }, [events, selectedDate, userId]);

    const groupedEvents = useMemo(() => {
        const groups = {};
        eventsForDay.forEach((event) => {
            const key = getEventCategory(event);
            if (!groups[key]) groups[key] = [];
            groups[key].push(event);
        });
        return groups;
    }, [eventsForDay]);

    const handleDeletePersonalEvent = (event) => {
        if (!event?.id || !event.is_personal || event.user_id !== userId) return;
        Alert.alert("일정 삭제", "이 개인 일정을 삭제할까요?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    try {
                        setDeletingId(event.id);
                        await deleteDoc(doc(db, "calendar_events", event.id));
                        await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
                        Alert.alert("삭제 완료", "일정을 삭제했습니다.");
                    } catch (error) {
                        console.log("Failed to delete personal event", error);
                        Alert.alert("오류", "일정을 삭제하지 못했습니다. 다시 시도해주세요.");
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };

    const renderDeleteAction = (event) => {
        if (!event?.is_personal || event.user_id !== userId) return null;
        return (
            <Button
                variant="ghost"
                className="mt-2 self-end"
                onPress={() => handleDeletePersonalEvent(event)}
                disabled={deletingId === event.id}
            >
                {deletingId === event.id ? "삭제 중..." : "삭제"}
            </Button>
        );
    };

    const renderEvents = (eventsList) =>
        eventsList.map((event) => {
            const eventDate = resolveEventDate(event.date);
            const category = getEventCategory(event);
            return (
                <StyledView key={event.id} className="p-4 border border-gray-200 rounded-lg mb-2 bg-white">
                    <StyledText className="text-base font-semibold text-gray-900 mb-1">{event.title}</StyledText>
                    {event.description && <StyledText className="text-sm text-gray-600 mb-1">{event.description}</StyledText>}
                    <StyledText className="text-xs text-gray-500">
                        {category} · {eventDate ? format(eventDate, "HH:mm", { locale: ko }) : ""}
                    </StyledText>
                    {renderDeleteAction(event)}
                </StyledView>
            );
        });

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="font-semibold text-sm text-gray-900">
                    {format(selectedDate, "M월 d일", { locale: ko })}
                </StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4">
                {isLoading ? (
                    <StyledText className="text-sm text-gray-500">일정을 불러오는 중입니다...</StyledText>
                ) : eventsForDay.length ? (
                    <>
                        {categorySections.map(({ key, label }) => {
                            const categoryEvents = groupedEvents[key];
                            if (!categoryEvents || !categoryEvents.length) return null;
                            return (
                                <StyledView key={key} className="mb-6">
                                    <StyledText className="text-sm font-bold text-gray-900 mb-2">{label}</StyledText>
                                    {renderEvents(categoryEvents)}
                                </StyledView>
                            );
                        })}
                    </>
                ) : (
                    <StyledView className="items-center py-20">
                        <StyledText className="text-sm text-gray-500">해당 날짜에 등록된 이벤트가 없습니다.</StyledText>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
