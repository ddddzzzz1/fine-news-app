import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useRouter } from "expo-router";
import { Button } from "../components/ui/button";
import { auth } from "../firebaseConfig";
import { usePushNotificationsContext } from "../context/PushNotificationsContext";
import { ChevronLeft } from "lucide-react-native";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const NOTIFICATION_TOPICS = [
    { key: "newsletters", label: "뉴스레터 알림" },
    { key: "contests", label: "공모전 알림" },
    { key: "community", label: "커뮤니티 알림" },
    { key: "reminders", label: "마감 임박 리마인더" },
];

const DEFAULT_QUIET_HOURS = {
    start_hour: 23,
    end_hour: 8,
};

export default function NotificationSettings() {
    const router = useRouter();
    const currentUser = auth.currentUser;

    const {
        pushSettings,
        permissionStatus,
        notificationsEnabled,
        registerForPushNotifications,
        setNotificationsEnabled,
        updatePreferences,
        updateQuietHours,
        isUpdatingPreferences,
        isSyncing,
    } = usePushNotificationsContext();

    const [localQuietHours, setLocalQuietHours] = useState(DEFAULT_QUIET_HOURS);

    useEffect(() => {
        const quiet = pushSettings?.quiet_hours ?? DEFAULT_QUIET_HOURS;
        setLocalQuietHours({
            start_hour: typeof quiet.start_hour === "number" ? quiet.start_hour : DEFAULT_QUIET_HOURS.start_hour,
            end_hour: typeof quiet.end_hour === "number" ? quiet.end_hour : DEFAULT_QUIET_HOURS.end_hour,
        });
    }, [pushSettings?.quiet_hours]);

    const topicPreferences = pushSettings?.preferences ?? {};
    const isPermissionGranted = permissionStatus === "granted";
    const quietHourControlsDisabled = !currentUser || !isPermissionGranted || !notificationsEnabled || isUpdatingPreferences;

    const formatHourLabel = useCallback((hour) => {
        if (typeof hour !== "number") return "";
        const normalized = ((hour % 24) + 24) % 24;
        const period = normalized >= 12 ? "오후" : "오전";
        const displayHour = normalized % 12 === 0 ? 12 : normalized % 12;
        return `${period} ${displayHour}시`;
    }, []);

    const handleGlobalNotificationToggle = (value) => {
        if (!currentUser || isUpdatingPreferences || !isPermissionGranted) return;
        setNotificationsEnabled(value);
    };

    const handlePreferenceToggle = (key, value) => {
        if (!currentUser || !notificationsEnabled || !isPermissionGranted) return;
        updatePreferences({ [key]: value });
    };

    const handleQuietHourAdjust = (field, delta) => {
        if (quietHourControlsDisabled) return;
        const nextValue = ((localQuietHours[field] ?? DEFAULT_QUIET_HOURS[field]) + delta + 24) % 24;
        const nextQuietHours = { ...localQuietHours, [field]: nextValue };
        setLocalQuietHours(nextQuietHours);
        updateQuietHours(nextQuietHours);
    };

    if (!currentUser) {
        return (
            <StyledSafeAreaView className="flex-1 bg-white items-center justify-center px-6">
                <StyledText className="text-base text-gray-600 mb-4">로그인 후 알림 설정을 이용할 수 있습니다.</StyledText>
                <Button className="rounded-full px-6" onPress={() => router.replace("/login")}>
                    로그인하기
                </Button>
            </StyledSafeAreaView>
        );
    }

    return (
        <StyledSafeAreaView className="flex-1 bg-gray-50">
            <StyledView className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <StyledTouchableOpacity
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={18} color="#111827" />
                </StyledTouchableOpacity>
                <StyledText className="text-lg font-semibold text-gray-900 flex-1 text-center -ml-10">알림 설정</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <StyledView className="px-4 py-4">
                <StyledText className="text-sm text-gray-600 mb-6">
                    홈의 종 버튼이나 여기에서 알림 권한을 관리할 수 있습니다. 권한을 허용하면 마감 임박 공고, 뉴스레터 업데이트
                    등을 실시간으로 받아볼 수 있어요.
                </StyledText>

                <StyledView className="bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100">
                    <StyledView className="flex-row items-center justify-between mb-2">
                        <StyledView>
                            <StyledText className="text-base font-semibold text-gray-900">푸시 알림</StyledText>
                            <StyledText className="text-xs text-gray-500 mt-1">
                                {isPermissionGranted
                                    ? "시스템 알림 허용됨"
                                    : permissionStatus === "denied"
                                      ? "디바이스 설정에서 알림을 허용해주세요."
                                      : "알림 권한을 요청 중입니다."}
                            </StyledText>
                        </StyledView>
                        <Switch
                            value={notificationsEnabled && isPermissionGranted}
                            onValueChange={handleGlobalNotificationToggle}
                            disabled={!isPermissionGranted || isUpdatingPreferences}
                            trackColor={{ false: "#d1d5db", true: "#6366f1" }}
                            thumbColor="#ffffff"
                        />
                    </StyledView>

                    {!isPermissionGranted && (
                        <StyledView className="mt-4 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                            <StyledText className="text-xs text-indigo-800 mb-2">
                                OS 설정에서 알림을 허용해야 맞춤 알림이 도착합니다.
                            </StyledText>
                            <Button
                                variant="outline"
                                className="rounded-full border-indigo-300"
                                disabled={isSyncing}
                                onPress={registerForPushNotifications}
                            >
                                {isSyncing ? "요청 중..." : "알림 허용하기"}
                            </Button>
                        </StyledView>
                    )}

                    <StyledView className="mt-6">
                        <StyledText className="text-sm font-semibold text-gray-900 mb-2">알림 채널</StyledText>
                        {NOTIFICATION_TOPICS.map((topic) => (
                            <StyledView
                                key={topic.key}
                                className="flex-row items-center justify-between py-3 border-b border-gray-100"
                            >
                                <StyledText className="text-sm text-gray-800">{topic.label}</StyledText>
                                <Switch
                                    value={!!topicPreferences[topic.key]}
                                    onValueChange={(value) => handlePreferenceToggle(topic.key, value)}
                                    disabled={!isPermissionGranted || !notificationsEnabled || isUpdatingPreferences}
                                    trackColor={{ false: "#d1d5db", true: "#4f46e5" }}
                                    thumbColor="#ffffff"
                                />
                            </StyledView>
                        ))}
                    </StyledView>

                    <StyledView className="mt-6">
                        <StyledView className="flex-row items-center justify-between mb-2">
                            <StyledView>
                                <StyledText className="text-sm font-semibold text-gray-900">조용한 시간</StyledText>
                                <StyledText className="text-xs text-gray-500 mt-1">
                                    이 시간대에는 알림이 자동으로 지연됩니다.
                                </StyledText>
                            </StyledView>
                            {quietHourControlsDisabled && (
                                <StyledText className="text-xs text-gray-400">알림 허용 후 설정 가능</StyledText>
                            )}
                        </StyledView>

                        <StyledView className="flex-row space-x-4">
                            {[
                                { label: "시작", field: "start_hour" },
                                { label: "종료", field: "end_hour" },
                            ].map((config) => (
                                <StyledView key={config.field} className="flex-1">
                                    <StyledText className="text-xs text-gray-500 mb-2">{config.label}</StyledText>
                                    <StyledView className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-3 py-2">
                                        <StyledTouchableOpacity
                                            className="w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center"
                                            onPress={() => handleQuietHourAdjust(config.field, -1)}
                                            disabled={quietHourControlsDisabled}
                                        >
                                            <StyledText className="text-base text-gray-700">-</StyledText>
                                        </StyledTouchableOpacity>
                                        <StyledText className="text-sm font-semibold text-gray-900">
                                            {formatHourLabel(localQuietHours[config.field])}
                                        </StyledText>
                                        <StyledTouchableOpacity
                                            className="w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center"
                                            onPress={() => handleQuietHourAdjust(config.field, 1)}
                                            disabled={quietHourControlsDisabled}
                                        >
                                            <StyledText className="text-base text-gray-700">+</StyledText>
                                        </StyledTouchableOpacity>
                                    </StyledView>
                                </StyledView>
                            ))}
                        </StyledView>
                    </StyledView>
                </StyledView>
            </StyledView>
        </StyledSafeAreaView>
    );
}
