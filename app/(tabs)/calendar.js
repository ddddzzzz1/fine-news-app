import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useRouter } from "expo-router";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import StockTicker from "../../components/StockTicker";
import { Button } from "../../components/ui/button";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

const fallbackEvents = [
    {
        id: "sample-1",
        title: "FOMC 회의 결과 발표",
        description: "미국 기준금리 방향을 확인하세요.",
        date: new Date().toISOString(),
        category: "거시",
    },
    {
        id: "sample-2",
        title: "테슬라 실적 발표",
        description: "빅테크 실적 시즌의 포문을 엽니다.",
        date: new Date(Date.now() + 86400000 * 2).toISOString(),
        category: "실적",
    },
    {
        id: "sample-3",
        title: "대한민국 소비자물가 지수",
        description: "물가 지표 발표일을 체크하세요.",
        date: new Date(Date.now() + 86400000 * 5).toISOString(),
        category: "물가",
    },
];

export default function CalendarTab() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("모든 이벤트");
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const router = useRouter();

    const { data: events = [], isLoading } = useQuery({
        queryKey: ["calendar-events"],
        queryFn: async () => {
            try {
                const q = query(collection(db, "calendar_events"), orderBy("date", "asc"), limit(50));
                const snapshot = await getDocs(q);
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.log("Error fetching calendar events", error);
                return [];
            }
        },
        initialData: [],
    });

    const allEvents = useMemo(() => (events.length ? events : fallbackEvents), [events]);

    const filteredEvents = useMemo(() => {
        return allEvents.filter((event) => {
            if (activeTab === "마이 이벤트") return event.is_personal;
            if (activeTab === "경제 이벤트") return event.category === "경제";
            return true;
        });
    }, [allEvents, activeTab]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getEventsForDay = (day) => filteredEvents.filter((event) => isSameDay(new Date(event.date), day));

    const eventsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return allEvents.filter((event) => isSameDay(new Date(event.date), selectedDate));
    }, [selectedDate, allEvents]);

    const eventColors = {
        경제: "bg-orange-100 text-orange-800 border border-orange-200",
        공모전: "bg-pink-100 text-pink-800 border border-pink-200",
        모둠인턴: "bg-purple-100 text-purple-800 border border-purple-200",
        마이: "bg-blue-100 text-blue-800 border border-blue-200",
        금융연수: "bg-green-100 text-green-800 border border-green-200",
        오픈콘텐츠: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    };

    const tabs = ["마이 이벤트", "경제 이벤트", "모든 이벤트"];

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="border-b border-gray-100 px-4 py-3">
                <StyledView className="flex-row items-center justify-between mb-3">
                    <StyledView className="flex-row items-center space-x-2">
                        <StyledTouchableOpacity
                            onPress={() => setCurrentDate(subMonths(currentDate, 1))}
                            className="h-8 w-8 rounded-full items-center justify-center"
                        >
                            <ChevronLeft size={18} color="#111827" />
                        </StyledTouchableOpacity>
                        <StyledText className="text-lg font-bold text-gray-900">
                            {activeTab}
                        </StyledText>
                        <StyledTouchableOpacity
                            onPress={() => setCurrentDate(addMonths(currentDate, 1))}
                            className="h-8 w-8 rounded-full items-center justify-center"
                        >
                            <ChevronRight size={18} color="#111827" />
                        </StyledTouchableOpacity>
                    </StyledView>
                    <StyledTouchableOpacity className="h-8 w-8 rounded-full items-center justify-center">
                        <CalendarDays size={18} color="#111827" />
                    </StyledTouchableOpacity>
                </StyledView>
                <StyledView className="flex-row items-center justify-center mb-3">
                    <StyledText className="text-2xl font-bold">{format(currentDate, "M월", { locale: ko })}</StyledText>
                    <StyledText className="text-2xl font-bold ml-2">{format(currentDate, "yyyy")}</StyledText>
                </StyledView>
                <StyledView className="flex-row border-b border-gray-200">
                    {tabs.map((tab) => (
                        <StyledTouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`flex-1 py-2 items-center ${
                                activeTab === tab ? "border-b-2 border-indigo-600" : "border-b-2 border-transparent"
                            }`}
                        >
                            <StyledText
                                className={`text-sm font-medium ${
                                    activeTab === tab ? "text-indigo-600" : "text-gray-500"
                                }`}
                            >
                                {tab}
                            </StyledText>
                        </StyledTouchableOpacity>
                    ))}
                </StyledView>
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4">
                <StyledView className="mb-2 flex-row flex-wrap">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                        <StyledText
                            key={day}
                            style={{ width: `${100 / 7}%` }}
                            className="text-center text-xs text-gray-500 font-medium mb-2"
                        >
                            {day}
                        </StyledText>
                    ))}
                </StyledView>
                <StyledView className="flex-row flex-wrap">
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                        <StyledView key={`empty-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
                    ))}
                    {daysInMonth.map((day) => {
                        const dayEvents = getEventsForDay(day);
                        const isToday = isSameDay(day, new Date());
                        return (
                            <StyledView key={day.toISOString()} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} className="p-1">
                                <StyledTouchableOpacity
                                    className="flex-1"
                                    onPress={() => router.push(`/calendar-day/${day.toISOString()}`)}
                                >
                                    <StyledView
                                        className={`flex-1 rounded-lg p-1 items-center ${
                                            isToday ? "bg-indigo-600" : "bg-white border border-gray-100"
                                        }`}
                                    >
                                        <StyledText
                                            className={`text-sm font-semibold ${
                                                isToday ? "text-white" : "text-gray-900"
                                            }`}
                                        >
                                            {format(day, "d")}
                                        </StyledText>
                                        <StyledView className="mt-1 w-full">
                                            {dayEvents.slice(0, 3).map((event) => (
                                                <StyledText
                                                    key={event.id}
                                                    className={`text-[8px] text-center rounded px-1 mb-0.5 ${
                                                        isToday
                                                            ? "text-white bg-white/20"
                                                            : eventColors[event.category] || "bg-gray-100 text-gray-600"
                                                    }`}
                                                    numberOfLines={1}
                                                >
                                                    {event.title}
                                                </StyledText>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <StyledText className="text-[8px] text-center text-indigo-600">view more</StyledText>
                                            )}
                                        </StyledView>
                                    </StyledView>
                                </StyledTouchableOpacity>
                            </StyledView>
                        );
                    })}
                </StyledView>

                {showDetail && selectedDate && (
                    <StyledView className="border border-gray-200 rounded-2xl mt-4 bg-white">
                        <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 rounded-t-2xl">
                            <StyledText className="text-base font-bold text-gray-900">
                                {format(selectedDate, "M월 d일 (EEE)", { locale: ko })}
                            </StyledText>
                            <StyledView className="flex-row space-x-2">
                                <Button variant="ghost" onPress={() => router.push(`/calendar-day/${selectedDate.toISOString()}`)}>
                                    전체 보기
                                </Button>
                                <Button variant="ghost" onPress={() => setShowDetail(false)}>
                                    닫기
                                </Button>
                            </StyledView>
                        </StyledView>
                        <StyledScrollView className="max-h-72 px-4 pt-3 pb-4">
                            {eventsForSelectedDate.length ? (
                                eventsForSelectedDate.map((event) => (
                                    <StyledView
                                        key={event.id}
                                        className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                                    >
                                        <StyledText className="text-sm font-semibold text-gray-900 mb-1">
                                            {event.title}
                                        </StyledText>
                                        {event.description && (
                                            <StyledText className="text-xs text-gray-600 mb-1">
                                                {event.description}
                                            </StyledText>
                                        )}
                                        <StyledText className="text-[11px] text-gray-500">
                                            {event.category || "기타"} ·{" "}
                                            {event.date ? format(new Date(event.date), "HH:mm", { locale: ko }) : ""}
                                        </StyledText>
                                    </StyledView>
                                ))
                            ) : (
                                <StyledText className="text-sm text-gray-500">해당 날짜에 이벤트가 없습니다.</StyledText>
                            )}
                        </StyledScrollView>
                    </StyledView>
                )}

                {!events.length && (
                    <StyledView className="px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-100 mt-6">
                        <StyledText className="text-xs text-indigo-600 text-center">
                            Firestore의 `calendar_events` 컬렉션에 데이터를 추가하면 실제 이벤트가 표시됩니다.
                        </StyledText>
                    </StyledView>
                )}
            </StyledScrollView>

            <StockTicker />
        </StyledSafeAreaView>
    );
}
