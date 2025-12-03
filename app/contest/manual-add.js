import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Stack, useRouter } from "expo-router";
import { Button } from "../../components/ui/button";
import { useAdminClaims } from "../../hooks/useAdminClaims";
import { addDoc, collection, serverTimestamp, Timestamp, doc, writeBatch } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useQueryClient } from "@tanstack/react-query";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

const CATEGORY_LABELS = {
    activity: "대외활동",
    job: "취업",
};

const CATEGORY_OPTIONS = ["activity", "job"];

const buildDateIso = (year, month, day) => {
    if (!year || !month || !day) return null;
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const parsed = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    if (isNaN(parsed.getTime())) return null;
    if (parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d) return null;
    return parsed.toISOString();
};

export default function ContestManualAdd() {
    const { isAdmin, isAdminLoading } = useAdminClaims();
    const router = useRouter();
    const currentUser = auth.currentUser;
    const queryClient = useQueryClient();

    const [title, setTitle] = useState("");
    const [organizer, setOrganizer] = useState("");
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
    const [startYear, setStartYear] = useState("");
    const [startMonth, setStartMonth] = useState("");
    const [startDay, setStartDay] = useState("");
    const [endYear, setEndYear] = useState("");
    const [endMonth, setEndMonth] = useState("");
    const [endDay, setEndDay] = useState("");
    const [applyUrl, setApplyUrl] = useState("");
    const [description, setDescription] = useState("");
    const [requirements, setRequirements] = useState("");
    const [benefits, setBenefits] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert("입력 확인", "제목을 입력해 주세요.");
            return;
        }
        if (!category) {
            Alert.alert("입력 확인", "카테고리를 선택해 주세요.");
            return;
        }
        if (!endYear || !endMonth || !endDay) {
            Alert.alert("입력 확인", "마감일 연·월·일을 모두 입력해 주세요.");
            return;
        }
        if (!currentUser?.uid) {
            Alert.alert("로그인 필요", "관리자 계정으로 다시 로그인해 주세요.");
            return;
        }

        const parsedStartIso = buildDateIso(startYear, startMonth, startDay);
        const parsedEndIso = buildDateIso(endYear, endMonth, endDay);

        if (!parsedEndIso) {
            Alert.alert("입력 확인", "마감일 형식을 확인해 주세요. (예: 2025, 12, 30)");
            return;
        }

        // Convert ISO strings to Firestore Timestamps
        const startTimestamp = parsedStartIso ? Timestamp.fromDate(new Date(parsedStartIso)) : null;
        const endTimestamp = Timestamp.fromDate(new Date(parsedEndIso));

        setIsSaving(true);
        try {
            // Create a new document reference to get an ID
            const newDocRef = doc(collection(db, "contests"));
            const newId = newDocRef.id;

            const commonData = {
                title: title.trim(),
                organizer: organizer.trim(),
                category,
                start_date: startTimestamp,
                end_date: endTimestamp,
                apply_url: applyUrl.trim(),
                description: description.trim(),
                image_url: "", // Placeholder
                created_by: currentUser?.email || null,
                created_at: serverTimestamp(),
            };

            const batch = writeBatch(db);

            // 1. Summary collection
            batch.set(doc(db, "contests", newId), commonData);

            // 2. Detail collection
            batch.set(doc(db, "contest_details", newId), {
                ...commonData,
                requirements: requirements.trim(),
                benefits: benefits.trim(),
            });

            await batch.commit();

            await queryClient.invalidateQueries({ queryKey: ["contests"] });
            Alert.alert("등록 완료", "공모전이 추가되었습니다.", [
                { text: "확인", onPress: () => router.back() },
            ]);
        } catch (error) {
            console.log("Failed to add contest", error);
            Alert.alert("오류", "공모전을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isAdminLoading) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white items-center justify-center">
                <StyledText className="text-sm text-gray-500">불러오는 중...</StyledText>
            </StyledSafeAreaView>
        );
    }

    if (!isAdmin) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white items-center justify-center px-6">
                <StyledText className="text-base text-gray-600 mb-4">관리자만 수기 등록이 가능합니다.</StyledText>
                <Button className="rounded-full px-6" onPress={() => router.back()}>
                    돌아가기
                </Button>
            </StyledSafeAreaView>
        );
    }

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" onPress={() => router.back()}>
                    <StyledText className="text-sm text-gray-600">닫기</StyledText>
                </Button>
                <StyledText className="text-lg font-bold text-gray-900">공모전 수기 추가</StyledText>
                <StyledView style={{ width: 52 }} />
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 24 }}>
                <StyledView className="space-y-6">
                    <Field label="제목" value={title} onChangeText={setTitle} placeholder="공모전 제목을 입력하세요" />
                    <Field label="주최/주관" value={organizer} onChangeText={setOrganizer} placeholder="주최/주관" />
                    <StyledView>
                        <StyledText className="text-sm text-gray-700 mb-2">카테고리</StyledText>
                        <StyledView className="flex-row space-x-2">
                            {CATEGORY_OPTIONS.map((option) => (
                                <StyledTouchableOpacity
                                    key={option}
                                    onPress={() => setCategory(option)}
                                    className={`px-3 py-2 rounded-full border ${category === option ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200"
                                        }`}
                                >
                                    <StyledText
                                        className={category === option ? "text-indigo-700 text-sm" : "text-gray-700 text-sm"}
                                    >
                                        {CATEGORY_LABELS[option]}
                                    </StyledText>
                                </StyledTouchableOpacity>
                            ))}
                        </StyledView>
                    </StyledView>
                    <DateFields
                        label="시작일"
                        year={startYear}
                        month={startMonth}
                        day={startDay}
                        onYearChange={setStartYear}
                        onMonthChange={setStartMonth}
                        onDayChange={setStartDay}
                    />
                    <DateFields
                        label="마감일"
                        year={endYear}
                        month={endMonth}
                        day={endDay}
                        onYearChange={setEndYear}
                        onMonthChange={setEndMonth}
                        onDayChange={setEndDay}
                    />
                    <Field label="지원 링크" value={applyUrl} onChangeText={setApplyUrl} placeholder="https://..." />
                    <Field
                        label="설명"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="공모전 설명을 입력하세요"
                        multiline
                    />
                    <Field
                        label="지원 자격"
                        value={requirements}
                        onChangeText={setRequirements}
                        placeholder="지원 가능 대상, 학년, 전공 등"
                        multiline
                    />
                    <Field
                        label="혜택"
                        value={benefits}
                        onChangeText={setBenefits}
                        placeholder="상금, 인턴십 연계 등"
                        multiline
                    />
                </StyledView>

                <Button className="mt-6 h-12 rounded-full" onPress={handleSubmit} disabled={isSaving}>
                    {isSaving ? "저장 중..." : "공모전 추가"}
                </Button>
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}

function Field({ label, value, onChangeText, placeholder, multiline = false }) {
    return (
        <StyledView>
            <StyledText className="text-sm text-gray-700 mb-2">{label}</StyledText>
            <StyledTextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                multiline={multiline}
                textAlignVertical={multiline ? "top" : "center"}
                className={`border border-gray-200 rounded-xl px-3 ${multiline ? "py-3 min-h-[100px]" : "h-11"} text-sm`}
            />
        </StyledView>
    );
}

function DateFields({ label, year, month, day, onYearChange, onMonthChange, onDayChange }) {
    return (
        <StyledView>
            <StyledText className="text-sm text-gray-700 mb-2">{label}</StyledText>
            <StyledView className="flex-row space-x-2">
                <StyledTextInput
                    value={year}
                    onChangeText={onYearChange}
                    placeholder="YYYY"
                    keyboardType="number-pad"
                    className="flex-1 border border-gray-200 rounded-xl px-3 h-11 text-sm"
                />
                <StyledTextInput
                    value={month}
                    onChangeText={onMonthChange}
                    placeholder="MM"
                    keyboardType="number-pad"
                    className="w-16 border border-gray-200 rounded-xl px-3 h-11 text-sm"
                />
                <StyledTextInput
                    value={day}
                    onChangeText={onDayChange}
                    placeholder="DD"
                    keyboardType="number-pad"
                    className="w-16 border border-gray-200 rounded-xl px-3 h-11 text-sm"
                />
            </StyledView>
        </StyledView>
    );
}
