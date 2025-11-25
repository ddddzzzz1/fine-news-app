import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useRouter } from "expo-router";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebaseConfig";
import { useUserProfile } from "../lib/useUserProfile";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Bell,
    ChevronLeft,
    GraduationCap,
    Lock,
    Mail,
    MonitorSmartphone,
    Moon,
    ShieldCheck,
    SunMedium,
    Trash2,
    User,
} from "lucide-react-native";
import { useThemeMode } from "../context/ThemeContext";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const statusMetaMap = {
    verified: { text: "학생 인증 완료", badge: "bg-green-50 text-green-700 border-0" },
    pending: { text: "인증 심사 중", badge: "bg-amber-50 text-amber-700 border-0" },
    rejected: { text: "재업로드 필요", badge: "bg-red-50 text-red-600 border-0" },
    unverified: { text: "학생 인증 필요", badge: "bg-gray-100 text-gray-500 border-0" },
};

const THEME_OPTIONS = [
    {
        value: "system",
        label: "시스템 기본",
        description: "디바이스 설정에 맞춰 자동 전환됩니다.",
        icon: MonitorSmartphone,
    },
    { value: "light", label: "라이트 모드", description: "항상 밝은 배경으로 표시합니다.", icon: SunMedium },
    { value: "dark", label: "다크 모드", description: "어두운 배경으로 눈부심을 줄여줍니다.", icon: Moon },
];

function InfoRow({ icon: Icon, label, value, badgeClassName }) {
    return (
        <StyledView className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <StyledView className="flex-row items-center space-x-3">
                <Icon size={18} color="#4b5563" />
                <StyledText className="text-sm text-gray-600">{label}</StyledText>
            </StyledView>
            <StyledView className="flex-row items-center space-x-2">
                {badgeClassName ? (
                    <Badge className={`${badgeClassName} text-xs`}>{value}</Badge>
                ) : (
                    <StyledText className="text-sm font-semibold text-gray-900">{value}</StyledText>
                )}
            </StyledView>
        </StyledView>
    );
}

function ActionRow({ icon: Icon, title, description, onPress, disabled }) {
    return (
        <StyledTouchableOpacity
            onPress={onPress}
            disabled={disabled}
            className={`flex-row items-center justify-between py-4 ${disabled ? "opacity-40" : ""}`}
        >
            <StyledView className="flex-row items-center space-x-3 flex-1">
                <StyledView className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center">
                    <Icon size={18} color="#4f46e5" />
                </StyledView>
                <StyledView className="flex-1">
                    <StyledText className="text-sm font-semibold text-gray-900">{title}</StyledText>
                    {!!description && <StyledText className="text-xs text-gray-500 mt-0.5">{description}</StyledText>}
                </StyledView>
            </StyledView>
            <StyledText className="text-sm font-semibold text-indigo-600">관리</StyledText>
        </StyledTouchableOpacity>
    );
}

function ThemeOptionRow({ option, selected, onSelect, disabled }) {
    const Icon = option.icon;
    return (
        <StyledTouchableOpacity
            onPress={onSelect}
            disabled={disabled}
            className={`border rounded-2xl px-4 py-3 flex-row items-center justify-between ${selected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"
                } ${disabled ? "opacity-50" : ""}`}
        >
            <StyledView className="flex-row items-center space-x-3 flex-1">
                <StyledView
                    className={`w-10 h-10 rounded-2xl items-center justify-center ${selected ? "bg-white" : "bg-gray-100"
                        }`}
                >
                    <Icon size={18} color={selected ? "#4338ca" : "#4b5563"} />
                </StyledView>
                <StyledView className="flex-1">
                    <StyledText className={`text-sm font-semibold ${selected ? "text-indigo-900" : "text-gray-900"}`}>
                        {option.label}
                    </StyledText>
                    <StyledText className="text-xs text-gray-500 mt-0.5">{option.description}</StyledText>
                </StyledView>
            </StyledView>
            <StyledText className={`text-xs font-semibold ${selected ? "text-indigo-700" : "text-gray-400"}`}>
                {selected ? "선택됨" : "선택"}
            </StyledText>
        </StyledTouchableOpacity>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const email = currentUser?.email;
    const { data: userProfile } = useUserProfile(userId);
    const profile = userProfile || {};
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const deleteAccountCallable = useMemo(() => httpsCallable(functions, "closeAccount"), [functions]);
    const { theme: themePreference, setTheme, isReady: themeReady } = useThemeMode();

    const verificationStatus = profile.verification_status || "unverified";
    const statusMeta = statusMetaMap[verificationStatus] || statusMetaMap.unverified;
    const nickname =
        (profile.nickname && profile.nickname.trim()) ||
        profile.korean_name ||
        profile.english_name ||
        currentUser?.displayName ||
        (email ? email.split("@")[0] : "-");
    const campusName = profile.university_name || currentUser?.photoURL || "미등록";

    const rejectionReason = profile.rejection_reason || profile.verification_feedback || "";
    const canTriggerPasswordReset = useMemo(() => {
        if (!currentUser) return false;
        const providers = currentUser.providerData || [];
        return providers.some((provider) => provider.providerId === "password");
    }, [currentUser]);

    const handlePasswordReset = () => {
        if (!email) {
            Alert.alert("이메일 확인 필요", "비밀번호를 재설정하려면 로그인한 계정의 이메일이 필요합니다.");
            return;
        }
        if (!canTriggerPasswordReset) {
            Alert.alert("연동된 로그인", "Google 등 외부 계정으로 로그인한 경우 해당 서비스에서 비밀번호를 변경해야 합니다.");
            return;
        }
        router.push("/account-password");
    };

    const runAccountDeletion = async () => {
        if (!currentUser) return;
        setIsDeletingAccount(true);
        try {
            await deleteAccountCallable();
            Alert.alert("삭제 완료", "계정과 개인 데이터가 삭제되었습니다.", [
                {
                    text: "확인",
                    onPress: () => router.replace("/login"),
                },
            ]);
        } catch (error) {
            console.log("Account deletion failed", error);
            const errorCode = error?.code || "unknown";
            if (errorCode === "functions/unauthenticated") {
                Alert.alert("로그인 필요", "계정을 삭제하려면 다시 로그인해주세요.", [
                    {
                        text: "확인",
                        onPress: () => router.replace("/login"),
                    },
                ]);
            } else {
                Alert.alert("삭제 실패", "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.");
            }
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleAccountDeletion = () => {
        if (!currentUser) {
            Alert.alert("로그인 필요", "계정을 삭제하려면 먼저 로그인해주세요.");
            return;
        }
        if (isDeletingAccount) {
            return;
        }
        Alert.alert(
            "계정을 삭제할까요?",
            "학생증 인증 자료, 저장한 공고, 개인 일정, 커뮤니티 글이 모두 삭제되며 되돌릴 수 없습니다.",
            [
                { text: "취소", style: "cancel" },
                { text: "삭제", style: "destructive", onPress: runAccountDeletion },
            ]
        );
    };

    const handleThemeSelect = useCallback(
        (value) => {
            if (!themeReady) return;
            setTheme(value);
        },
        [setTheme, themeReady]
    );

    if (!currentUser) {
        return (
            <StyledSafeAreaView className="flex-1 bg-white items-center justify-center px-6">
                <StyledText className="text-base text-gray-600 mb-4">로그인 후 설정을 확인할 수 있습니다.</StyledText>
                <Button className="rounded-full px-6" onPress={() => router.replace("/login")}>
                    로그인하기
                </Button>
            </StyledSafeAreaView>
        );
    }

    return (
        <StyledSafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
            <StyledView className="bg-white flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                <StyledTouchableOpacity
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={18} color="#111827" />
                </StyledTouchableOpacity>
                <StyledText className="text-lg font-semibold text-gray-900">설정</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <ScrollView
                className="flex-1 px-4 py-4"
                contentContainerStyle={{ gap: 20 }}
                showsVerticalScrollIndicator={false}
            >
                <StyledView className="bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100">
                    <StyledText className="text-base font-semibold text-gray-900 mb-4">계정 & 인증</StyledText>
                    <InfoRow icon={User} label="닉네임" value={nickname || "-"} />
                    <InfoRow icon={Mail} label="이메일" value={email || "-"} />
                    <InfoRow icon={GraduationCap} label="소속 캠퍼스" value={campusName} />
                    <InfoRow
                        icon={ShieldCheck}
                        label="인증 상태"
                        value={statusMeta.text}
                        badgeClassName={statusMeta.badge}
                    />

                    <StyledView className="mt-4 space-y-3">
                        <Button
                            className="rounded-full"
                            variant="outline"
                            onPress={() => router.push("/university-verification")}
                        >
                            학생증 다시 업로드
                        </Button>
                        <Button
                            className="rounded-full"
                            variant="secondary"
                            disabled={!rejectionReason}
                            onPress={() =>
                                Alert.alert(
                                    "반려 사유",
                                    rejectionReason || "관리자 검토 결과가 도착하면 이곳에 표시됩니다."
                                )
                            }
                        >
                            반려 사유 보기
                        </Button>
                    </StyledView>
                </StyledView>

                <StyledView className="bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100">
                    <StyledText className="text-base font-semibold text-gray-900 mb-4">보안 & 데이터 컨트롤</StyledText>
                    <ActionRow
                        icon={User}
                        title="닉네임 변경"
                        description="마이 탭과 커뮤니티에 노출됩니다."
                        onPress={() => router.push("/account-nickname")}
                    />
                    <ActionRow
                        icon={Lock}
                        title="비밀번호 변경"
                        description="새 비밀번호 설정 또는 재설정 메일 발송"
                        onPress={handlePasswordReset}
                        disabled={!email}
                    />
                    <ActionRow
                        icon={Trash2}
                        title="계정 완전 삭제"
                        description={
                            isDeletingAccount
                                ? "계정을 삭제하는 중입니다..."
                                : "학생증 인증, 저장한 공고, 개인 일정, 커뮤니티 글이 즉시 삭제됩니다."
                        }
                        onPress={handleAccountDeletion}
                        disabled={isDeletingAccount}
                    />
                </StyledView>

                <StyledView className="bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100">
                    <StyledView className="flex-row items-center justify-between mb-4">
                        <StyledView>
                            <StyledText className="text-base font-semibold text-gray-900">화면 모드</StyledText>
                            <StyledText className="text-xs text-gray-500 mt-1">
                                라이트/다크 모드가 앱 전역에 적용됩니다.
                            </StyledText>
                        </StyledView>
                        {!themeReady && <StyledText className="text-xs text-gray-400">불러오는 중...</StyledText>}
                    </StyledView>

                    <StyledView className="space-y-3">
                        {THEME_OPTIONS.map((option) => (
                            <ThemeOptionRow
                                key={option.value}
                                option={option}
                                selected={themePreference === option.value}
                                onSelect={() => handleThemeSelect(option.value)}
                                disabled={!themeReady}
                            />
                        ))}
                    </StyledView>
                </StyledView>

                <StyledView className="bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100">
                    <StyledText className="text-base font-semibold text-gray-900 mb-2">추가 지원</StyledText>
                    <StyledText className="text-xs text-gray-500 mb-4">
                        푸시 알림 토글이나 Quiet Hours 등 세부 알림 제어는 “알림 설정” 화면에서 계속 관리할 수 있습니다.
                    </StyledText>
                    <Button className="rounded-full flex-row items-center space-x-2" onPress={() => router.push("/notification-settings")}>
                        <>
                            <Bell size={16} color="#ffffff" />
                            <StyledText className="text-sm font-semibold text-white">알림 설정 바로가기</StyledText>
                        </>
                    </Button>
                </StyledView>
            </ScrollView>
        </StyledSafeAreaView>
    );
}
