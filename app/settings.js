import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useUserProfile } from "../lib/useUserProfile";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Bell,
    ChevronLeft,
    Download,
    GraduationCap,
    Lock,
    Mail,
    RefreshCcw,
    ShieldCheck,
    Trash2,
} from "lucide-react-native";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const SUPPORT_MESSAGE =
    "팀에 직접 연락해 주세요. Contact 정보는 README의 문의하기 섹션을 참고하면 빠르게 확인할 수 있습니다.";

const statusMetaMap = {
    verified: { text: "학생 인증 완료", badge: "bg-green-50 text-green-700 border-0" },
    pending: { text: "인증 심사 중", badge: "bg-amber-50 text-amber-700 border-0" },
    rejected: { text: "재업로드 필요", badge: "bg-red-50 text-red-600 border-0" },
    unverified: { text: "학생 인증 필요", badge: "bg-gray-100 text-gray-500 border-0" },
};

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

export default function SettingsScreen() {
    const router = useRouter();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const email = currentUser?.email;
    const { data: userProfile } = useUserProfile(userId);
    const profile = userProfile || {};

    const verificationStatus = profile.verification_status || "unverified";
    const statusMeta = statusMetaMap[verificationStatus] || statusMetaMap.unverified;
    const campusName = profile.university_name || currentUser?.photoURL || "미등록";

    const rejectionReason = profile.rejection_reason || profile.verification_feedback || "";
    const canTriggerPasswordReset = useMemo(() => {
        if (!currentUser) return false;
        const providers = currentUser.providerData || [];
        return providers.some((provider) => provider.providerId === "password");
    }, [currentUser]);

    const handlePasswordReset = async () => {
        if (!email) {
            Alert.alert("이메일 확인 필요", "비밀번호를 재설정하려면 로그인한 계정의 이메일이 필요합니다.");
            return;
        }
        if (!canTriggerPasswordReset) {
            Alert.alert("연동된 로그인", "Google 등 외부 계정으로 로그인한 경우 해당 서비스에서 비밀번호를 변경해야 합니다.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert("이메일 전송 완료", `${email} 주소로 비밀번호 재설정 링크를 보냈습니다.`);
        } catch (error) {
            console.log("Password reset error", error);
            Alert.alert("요청 실패", "잠시 후 다시 시도하거나 관리자에게 문의해 주세요.");
        }
    };

    const handleGoogleManage = () => {
        Alert.alert("연동 정보", "Google 로그인 연동은 추후 계정 관리 페이지에서 제공될 예정입니다.");
    };

    const handleDownloadData = () => {
        Alert.alert("데이터 다운로드 요청", SUPPORT_MESSAGE);
    };

    const handleAccountDeletion = () => {
        Alert.alert(
            "계정 삭제 요청",
            "계정을 완전히 삭제하려면 고객지원에 요청서를 보내야 합니다. Contact 정보를 참고해 주세요."
        );
    };

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

            <StyledView className="flex-1 px-4 py-4 space-y-5">
                <StyledView className="bg-white rounded-2xl px-4 py-5 shadow-sm border border-gray-100">
                    <StyledText className="text-base font-semibold text-gray-900 mb-4">계정 & 인증</StyledText>
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
                        icon={Lock}
                        title="비밀번호 변경"
                        description="재설정 링크를 이메일로 전송합니다."
                        onPress={handlePasswordReset}
                        disabled={!email}
                    />
                    <ActionRow
                        icon={RefreshCcw}
                        title="Google 연동 관리"
                        description="연동된 로그인 공급자를 확인합니다."
                        onPress={handleGoogleManage}
                    />
                    <ActionRow
                        icon={Download}
                        title="데이터 다운로드"
                        description="개인 데이터 사본 요청"
                        onPress={handleDownloadData}
                    />
                    <ActionRow
                        icon={Trash2}
                        title="계정 삭제 요청"
                        description="완전 삭제를 요청하려면 지원팀에 연락하세요."
                        onPress={handleAccountDeletion}
                    />
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
            </StyledView>
        </StyledSafeAreaView>
    );
}
