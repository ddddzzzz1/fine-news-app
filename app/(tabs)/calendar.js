import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, limit, setDoc, doc, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
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
const StyledTextInput = styled(TextInput);

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

const normalizeCategory = (value) => {
    if (!value) return "";
    if (value === "모둠인턴" || value === "모둠 인턴") return "인턴";
    return value;
};

const getEventCategory = (event) => normalizeCategory(event.category) || "기타";

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
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDetail, setShowDetail] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventDescription, setNewEventDescription] = useState("");
    const [newEventTime, setNewEventTime] = useState("");
    const [newEventDate, setNewEventDate] = useState(new Date());
    const [newEventCategory, setNewEventCategory] = useState("마이");
    const [isSavingEvent, setIsSavingEvent] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;

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
            const category = getEventCategory(event);
            if (event.is_personal && event.user_id && event.user_id !== userId) {
                return false;
            }
            if (activeTab === "마이 이벤트") return event.is_personal && event.user_id === userId;
            if (activeTab === "경제 이벤트") return category === "경제";
            return true;
        });
    }, [allEvents, activeTab, userId]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getEventsForDay = (day) =>
        filteredEvents.filter((event) => {
            const eventDate = resolveEventDate(event.date);
            return eventDate ? isSameDay(eventDate, day) : false;
        });

    const eventsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return allEvents.filter((event) => {
            const eventDate = resolveEventDate(event.date);
            if (!eventDate || !isSameDay(eventDate, selectedDate)) return false;
            if (event.is_personal && event.user_id && event.user_id !== userId) return false;
            return true;
        });
    }, [selectedDate, allEvents, userId]);

    const eventColors = {
        경제: { badge: "bg-orange-100 text-orange-800 border border-orange-200", dot: "bg-orange-500" },
        공모전: { badge: "bg-pink-100 text-pink-800 border border-pink-200", dot: "bg-pink-500" },
        인턴: { badge: "bg-purple-100 text-purple-800 border border-purple-200", dot: "bg-purple-500" },
        마이: { badge: "bg-blue-100 text-blue-800 border border-blue-200", dot: "bg-blue-500" },
        금융연수: { badge: "bg-green-100 text-green-800 border border-green-200", dot: "bg-green-500" },
        오픈콘텐츠: { badge: "bg-indigo-100 text-indigo-800 border border-indigo-200", dot: "bg-indigo-500" },
    };
    const categoryOptions = Object.keys(eventColors);
    const categoryOptions = Object.keys(eventColors);

    const tabs = ["마이 이벤트", "경제 이벤트", "모든 이벤트"];

    const ColorLegend = ({ compact = false }) => (
        <StyledScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: compact ? 0 : 2 }}
        >
            {Object.entries(eventColors).map(([key, value]) => (
                <StyledView key={key} className="flex-row items-center mr-4 mb-1">
                    <StyledView
                        className={`rounded-full mr-1 ${compact ? "h-1.5 w-1.5" : "h-2 w-2"} ${value.dot}`}
                    />
                    <StyledText className={`${compact ? "text-[10px]" : "text-[11px]"} text-gray-500`}>{key}</StyledText>
                </StyledView>
            ))}
        </StyledScrollView>
    );

    const handleDayPress = (day) => {
        setSelectedDate(day);
        setNewEventDate(day);
        setShowDetail(true);
    };

    const handleAddEventPress = (date = selectedDate || new Date()) => {
        if (!userId) {
            Alert.alert("로그인 필요", "내 일정을 추가하려면 로그인해주세요.", [
                { text: "취소", style: "cancel" },
                { text: "로그인", onPress: () => router.push("/login") },
            ]);
            return;
        }
        setNewEventDate(date);
        setNewEventCategory("마이");
        setShowAddModal(true);
    };

    const resetEventForm = () => {
        setNewEventTitle("");
        setNewEventDescription("");
        setNewEventTime("");
        setNewEventCategory("마이");
    };

    const handleSavePersonalEvent = async () => {
        if (!userId) {
            Alert.alert("로그인 필요", "내 일정을 추가하려면 로그인해주세요.");
            return;
        }
        if (!newEventTitle.trim()) {
            Alert.alert("입력 확인", "제목을 입력해주세요.");
            return;
        }
        const baseDate = newEventDate || selectedDate || new Date();
        const finalDate = new Date(baseDate);
        if (newEventTime.trim()) {
            const [hourString, minuteString = "0"] = newEventTime.split(":");
            const parsedHour = Number(hourString);
            const parsedMinute = Number(minuteString);
            if (
                Number.isNaN(parsedHour) ||
                Number.isNaN(parsedMinute) ||
                parsedHour < 0 ||
                parsedHour > 23 ||
                parsedMinute < 0 ||
                parsedMinute > 59
            ) {
                Alert.alert("시간 형식", "시간은 HH:MM 형식으로 입력해주세요.");
                return;
            }
            finalDate.setHours(parsedHour, parsedMinute, 0, 0);
        } else {
            finalDate.setHours(9, 0, 0, 0);
        }

        try {
            setIsSavingEvent(true);
            const docId = `saved-${userId}-${finalDate.getTime()}-${Date.now()}`;
            await setDoc(doc(db, "calendar_events", docId), {
                title: newEventTitle.trim(),
                description: newEventDescription.trim() || "",
                date: Timestamp.fromDate(finalDate),
                category: newEventCategory || "마이",
                is_personal: true,
                user_id: userId,
                created_by: currentUser?.email || "",
                created_at: Timestamp.fromDate(new Date()),
            });
            await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
            setSelectedDate(finalDate);
            setShowDetail(true);
            setShowAddModal(false);
            resetEventForm();
            Alert.alert("저장 완료", "일정이 캘린더에 추가되었습니다.");
        } catch (error) {
            console.log("Failed to add personal event", error);
            Alert.alert("저장 실패", "일정을 저장하지 못했습니다. 다시 시도해주세요.");
        } finally {
            setIsSavingEvent(false);
        }
    };

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
                    <StyledTouchableOpacity
                        className="h-8 w-8 rounded-full items-center justify-center"
                        onPress={() => handleAddEventPress()}
                    >
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
                <StyledView className="mt-3">
                    <Button variant="outline" onPress={() => handleAddEventPress()}>
                        내 일정 추가
                    </Button>
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
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const cellClasses = isToday
                            ? "bg-indigo-600"
                            : isSelected
                                ? "bg-indigo-50 border border-indigo-200"
                                : "bg-white border border-gray-100";
                        const dateColor = isToday ? "text-white" : isSelected ? "text-indigo-600" : "text-gray-900";
                        return (
                            <StyledView key={day.toISOString()} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} className="p-1">
                                <StyledTouchableOpacity
                                    className="flex-1"
                                    onPress={() => handleDayPress(day)}
                                    onLongPress={() => router.push(`/calendar-day/${day.toISOString()}`)}
                                >
                                    <StyledView
                                        className={`flex-1 rounded-lg p-1 items-center ${cellClasses}`}
                                    >
                                        <StyledText
                                            className={`text-sm font-semibold ${dateColor}`}
                                        >
                                            {format(day, "d")}
                                        </StyledText>
                                        <StyledView className="mt-1 w-full">
                                            {dayEvents.slice(0, 3).map((event) => {
                                                const category = getEventCategory(event);
                                                return (
                                                    <StyledText
                                                        key={event.id}
                                                        className={`text-[8px] text-center rounded px-1 mb-0.5 ${
                                                            isToday
                                                                ? "text-white bg-white/20"
                                                                : eventColors[category]?.badge || "bg-gray-100 text-gray-600"
                                                        }`}
                                                        numberOfLines={1}
                                                    >
                                                        {event.title}
                                                    </StyledText>
                                                );
                                            })}
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
                                eventsForSelectedDate.map((event) => {
                                    const eventDate = resolveEventDate(event.date);
                                    const category = getEventCategory(event);
                                    return (
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
                                            {category} · {eventDate ? format(eventDate, "HH:mm", { locale: ko }) : ""}
                                        </StyledText>
                                    </StyledView>
                                );
                            })
                            ) : (
                                <StyledText className="text-sm text-gray-500">해당 날짜에 이벤트가 없습니다.</StyledText>
                            )}
                        </StyledScrollView>
                        <StyledView className="px-4 pb-4">
                            <Button variant="outline" onPress={() => handleAddEventPress(selectedDate)}>
                                이 날짜에 일정 추가
                            </Button>
                        </StyledView>
                    </StyledView>
                )}

                {!events.length && (
                    <StyledView className="px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-100 mt-6">
                        <StyledText className="text-xs text-indigo-600 text-center">
                            Firestore의 `calendar_events` 컬렉션에 데이터를 추가하면 실제 이벤트가 표시됩니다.
                        </StyledText>
                    </StyledView>
                )}

                {!filteredEvents.length && events.length > 0 && (
                    <StyledView className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 mt-4">
                        <StyledText className="text-xs text-gray-600 text-center">
                            선택한 탭에 표시할 이벤트가 없습니다. 새로운 일정을 추가해보세요.
                        </StyledText>
                    </StyledView>
                )}
            </StyledScrollView>

            <StyledView className="border-t border-gray-100 bg-white px-4 py-2">
                <ColorLegend compact />
            </StyledView>

            <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
                <StyledView className="flex-1 bg-black/40 justify-end">
                    <StyledView className="bg-white rounded-t-3xl px-5 pt-5 pb-8">
                        <StyledView className="flex-row items-center justify-between mb-4">
                            <StyledText className="text-lg font-bold text-gray-900">내 일정 추가</StyledText>
                            <Button variant="ghost" onPress={() => setShowAddModal(false)}>
                                닫기
                            </Button>
                        </StyledView>
                        <StyledView className="mb-3">
                            <StyledText className="text-xs text-gray-500 mb-1">날짜</StyledText>
                            <StyledView className="rounded-xl border border-gray-200 px-3 py-2">
                                <StyledText className="text-sm font-medium text-gray-900">
                                    {format(newEventDate, "yyyy.MM.dd (EEE)", { locale: ko })}
                                </StyledText>
                                <StyledText className="text-[11px] text-gray-400 mt-1">
                                    달력에서 날짜를 선택하면 자동으로 변경됩니다.
                                </StyledText>
                            </StyledView>
                        </StyledView>
                        <StyledView className="mb-3">
                            <StyledText className="text-xs text-gray-500 mb-1">제목</StyledText>
                            <StyledTextInput
                                value={newEventTitle}
                                onChangeText={setNewEventTitle}
                                placeholder="예: 모의투자 대회 접수 마감"
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                            />
                        </StyledView>
                        <StyledView className="mb-3">
                            <StyledText className="text-xs text-gray-500 mb-1">설명 (선택)</StyledText>
                            <StyledTextInput
                                value={newEventDescription}
                                onChangeText={setNewEventDescription}
                                placeholder="간단한 메모를 추가하세요"
                                multiline
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-[72px]"
                            />
                        </StyledView>
                        <StyledView className="mb-4">
                            <StyledText className="text-xs text-gray-500 mb-1">시간 (선택)</StyledText>
                            <StyledTextInput
                                value={newEventTime}
                                onChangeText={setNewEventTime}
                                placeholder="HH:MM"
                                keyboardType="numbers-and-punctuation"
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                            />
                            <StyledText className="text-[11px] text-gray-400 mt-1">
                                시간을 비워두면 오전 9시 일정으로 저장됩니다.
                            </StyledText>
                        </StyledView>
                        <StyledView className="mb-4">
                            <StyledText className="text-xs text-gray-500 mb-1">카테고리</StyledText>
                            <StyledView className="flex-row flex-wrap">
                                {categoryOptions.map((option) => {
                                    const selected = newEventCategory === option;
                                    return (
                                        <StyledTouchableOpacity
                                            key={option}
                                            className={`flex-row items-center px-3 py-1.5 rounded-full mr-2 mb-2 border ${
                                                selected ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200"
                                            }`}
                                            onPress={() => setNewEventCategory(option)}
                                        >
                                            <StyledView className={`h-2 w-2 rounded-full mr-1 ${eventColors[option]?.dot || "bg-gray-400"}`} />
                                            <StyledText
                                                className={`text-xs font-medium ${
                                                    selected ? "text-indigo-700" : "text-gray-600"
                                                }`}
                                            >
                                                {option}
                                            </StyledText>
                                        </StyledTouchableOpacity>
                                    );
                                })}
                            </StyledView>
                        </StyledView>
                        <StyledView className="mb-4">
                            <StyledText className="text-xs text-gray-500 mb-1">색상 안내</StyledText>
                            <ColorLegend compact />
                        </StyledView>
                        <Button className="rounded-full h-12" onPress={handleSavePersonalEvent} disabled={isSavingEvent}>
                            {isSavingEvent ? "저장 중..." : "일정 저장"}
                        </Button>
                    </StyledView>
                </StyledView>
            </Modal>

            <StockTicker />
        </StyledSafeAreaView>
    );
}
