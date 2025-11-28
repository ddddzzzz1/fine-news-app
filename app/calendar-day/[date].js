import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Clock, MapPin } from "lucide-react-native";
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

const eventColors = {
    마이: {
        accent: "bg-blue-500",
        badge: "bg-blue-100",
        badgeText: "text-blue-700",
    },
    경제: {
        accent: "bg-orange-500",
        badge: "bg-orange-100",
        badgeText: "text-orange-700",
    },
};

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

const getCategoryColors = (category) => eventColors[category] || { accent: "bg-gray-200", badge: "bg-gray-100", badgeText: "text-gray-600" };

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

    const formattedHeaderDate = format(selectedDate, "M월 d일 (EEE)", { locale: ko });

    const handleAddEventCTA = () => {
        router.push({
            pathname: "/(tabs)/calendar",
            params: { focusDate: selectedDate.toISOString() },
        });
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
            const colors = getCategoryColors(category);
            const timeLabel = eventDate ? format(eventDate, "HH:mm", { locale: ko }) : "--:--";
            return (
                <StyledView
                    key={event.id}
                    className="mb-4 rounded-2xl bg-white border border-gray-100"
                    style={{
                        shadowColor: "#0f172a",
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 6,
                    }}
                >
                    <StyledView className="flex-row rounded-2xl overflow-hidden">
                        <StyledView className={`w-1.5 ${colors.accent}`} />
                        <StyledView className="flex-1 flex-row p-4">
                            <StyledView className="items-center mr-4">
                                <StyledView className="h-9 w-9 rounded-full bg-indigo-50 items-center justify-center mb-1">
                                    <Clock size={16} color="#4c1d95" />
                                </StyledView>
                                <StyledText className="text-lg font-bold text-gray-900">{timeLabel}</StyledText>
                            </StyledView>
                            <StyledView className="flex-1">
                                <StyledView className="flex-row flex-wrap items-center mb-1">
                                    <StyledView className={`px-2 py-0.5 rounded-full mr-2 ${colors.badge}`}>
                                        <StyledText className={`text-[11px] font-semibold ${colors.badgeText}`}>{category}</StyledText>
                                    </StyledView>
                                    <StyledText className="text-[11px] text-gray-400">
                                        {eventDate ? format(eventDate, "EEE HH:mm", { locale: ko }) : ""}
                                    </StyledText>
                                </StyledView>
                                <StyledText className="text-base font-semibold text-gray-900">{event.title}</StyledText>
                                {event.description ? (
                                    <StyledView className="flex-row items-start mt-1">
                                        <MapPin size={14} color="#94a3b8" />
                                        <StyledText className="text-sm text-gray-600 ml-1 flex-1">{event.description}</StyledText>
                                    </StyledView>
                                ) : null}
                                {renderDeleteAction(event)}
                            </StyledView>
                        </StyledView>
                    </StyledView>
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
                    {formattedHeaderDate}
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
                            const colors = getCategoryColors(key);
                            return (
                                <StyledView key={key} className="mb-6">
                                    <StyledView className="flex-row items-center mb-2">
                                        <StyledView className={`h-2 w-2 rounded-full mr-2 ${colors.accent}`} />
                                        <StyledText className="text-sm font-bold text-gray-900">{label}</StyledText>
                                    </StyledView>
                                    {renderEvents(categoryEvents)}
                                </StyledView>
                            );
                        })}
                    </>
                ) : (
                    <StyledView className="items-center py-20">
                        <StyledText className="text-sm text-gray-500">해당 날짜에 등록된 이벤트가 없습니다.</StyledText>
                        <Button className="mt-4 rounded-full px-6" onPress={handleAddEventCTA}>
                            이 날짜에 일정 추가
                        </Button>
                    </StyledView>
                )}
                {eventsForDay.length ? (
                    <StyledView className="mt-4">
                        <Button className="rounded-full h-12" onPress={handleAddEventCTA}>
                            {format(selectedDate, "M월 d일")} 일정 추가
                        </Button>
                    </StyledView>
                ) : null}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
