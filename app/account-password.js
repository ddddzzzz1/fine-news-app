import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Button } from "../components/ui/button";
import { auth } from "../firebaseConfig";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    updatePassword,
} from "firebase/auth";
import { passwordValidators, validatePassword } from "../lib/passwordValidators";
import { isTestAccountEmail, logAuthEvent } from "../lib/authLogger";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);

export default function AccountPasswordScreen() {
    const router = useRouter();
    const currentUser = auth.currentUser;
    const email = currentUser?.email || "";
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [updating, setUpdating] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    const hasPasswordProvider = useMemo(() => {
        if (!currentUser) return false;
        const providers = currentUser.providerData || [];
        return providers.some((provider) => provider.providerId === "password");
    }, [currentUser]);

    const showProviderWarning = currentUser && !hasPasswordProvider;

    if (!currentUser) {
        return (
            <StyledSafeAreaView className="flex-1 bg-white items-center justify-center px-6">
                <StyledText className="text-base text-gray-600 mb-4">
                    로그인 후에 비밀번호를 재설정할 수 있습니다.
                </StyledText>
                <Button className="rounded-full px-6" onPress={() => router.replace("/login")}>
                    로그인하기
                </Button>
            </StyledSafeAreaView>
        );
    }

    const canSubmit =
        hasPasswordProvider &&
        currentPassword.length > 0 &&
        newPassword.length > 0 &&
        newPassword === confirmPassword &&
        validatePassword(newPassword) &&
        newPassword !== currentPassword &&
        !updating;

    const handleChangePassword = async () => {
        if (!email) {
            Alert.alert("이메일 확인 필요", "계정 이메일을 불러오지 못했습니다. 다시 로그인해주세요.");
            return;
        }
        if (!hasPasswordProvider) {
            Alert.alert("외부 로그인", "Google 등 외부 서비스로 로그인한 계정은 해당 서비스에서 비밀번호를 변경해주세요.");
            return;
        }
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("입력 오류", "현재 비밀번호와 새 비밀번호를 모두 입력해주세요.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("입력 오류", "새 비밀번호가 서로 일치하지 않습니다.");
            return;
        }
        if (newPassword === currentPassword) {
            Alert.alert("입력 오류", "새 비밀번호는 기존 비밀번호와 달라야 합니다.");
            return;
        }
        if (!validatePassword(newPassword)) {
            const failedRules = passwordValidators
                .filter((validator) => !validator.check(newPassword))
                .map((validator) => `• ${validator.message}`)
                .join("\n");
            Alert.alert("비밀번호 규칙을 확인해주세요", failedRules);
            return;
        }

        setUpdating(true);
        try {
            const credential = EmailAuthProvider.credential(email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            logAuthEvent("password_update_success", { uid: currentUser.uid });
            Alert.alert("변경 완료", "새 비밀번호로 다시 로그인할 수 있습니다.", [
                { text: "확인", onPress: () => router.back() },
            ]);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.log("Failed to update password", error);
            logAuthEvent("password_update_failed", { uid: currentUser.uid, error });
            let message = "비밀번호를 변경하지 못했습니다. 현재 비밀번호를 다시 확인해주세요.";
            if (error?.code === "auth/wrong-password") {
                message = "현재 비밀번호가 올바르지 않습니다.";
            } else if (error?.code === "auth/too-many-requests") {
                message = "잠시 후 다시 시도해주세요. 요청이 너무 많습니다.";
            }
            Alert.alert("변경 실패", message);
        } finally {
            setUpdating(false);
        }
    };

    const handleSendResetEmail = async () => {
        if (!email) {
            Alert.alert("이메일 확인 필요", "계정 이메일이 없어 메일을 보낼 수 없습니다.");
            return;
        }
        if (!hasPasswordProvider) {
            Alert.alert("외부 로그인", "Google 등 외부 계정으로 로그인한 경우 해당 서비스에서 재설정해야 합니다.");
            return;
        }
        setSendingEmail(true);
        try {
            await sendPasswordResetEmail(auth, email);
            const isTestAccount = isTestAccountEmail(email);
            logAuthEvent("password_reset_email_sent", { email, isTestAccount });
            const testAccountNote = isTestAccount
                ? "\n테스트 계정: 메일 수신 여부를 기록해주세요."
                : "";
            Alert.alert("메일 발송 완료", `비밀번호 재설정 링크를 ${email} 주소로 보냈습니다.${testAccountNote}`);
        } catch (error) {
            console.log("Failed to send password reset email", error);
            logAuthEvent("password_reset_email_failed", { email, error });
            let message = "재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.";
            if (error?.code === "auth/invalid-email") {
                message = "이메일 형식이 올바르지 않습니다.";
            }
            Alert.alert("메일 발송 실패", message);
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" onPress={() => router.back()} className="rounded-full">
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="text-base font-semibold text-gray-900">비밀번호 재설정</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <StyledView className="flex-1 px-6 py-6 space-y-6">
                    {showProviderWarning && (
                        <StyledView className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                            <StyledText className="text-sm text-indigo-800">
                                Google 등 외부 로그인 계정입니다. 비밀번호 대신 해당 서비스에서 계정 보안을 관리해주세요.
                            </StyledText>
                        </StyledView>
                    )}

                    <StyledView>
                        <StyledText className="text-lg font-bold text-gray-900 mb-1">현재 비밀번호 확인</StyledText>
                        <StyledText className="text-xs text-gray-500 mb-3">
                            비밀번호를 변경하기 전에 본인 확인을 진행합니다.
                        </StyledText>
                        <StyledTextInput
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="현재 비밀번호"
                            secureTextEntry
                            className="border border-gray-200 rounded-2xl px-4 py-3 text-base"
                            editable={!updating && hasPasswordProvider}
                        />
                    </StyledView>

                    <StyledView>
                        <StyledText className="text-lg font-bold text-gray-900 mb-1">새 비밀번호</StyledText>
                        <StyledText className="text-xs text-gray-500 mb-3">
                            회원가입과 동일한 보안 규칙이 적용됩니다.
                        </StyledText>
                        <StyledTextInput
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="새 비밀번호"
                            secureTextEntry
                            className="border border-gray-200 rounded-2xl px-4 py-3 text-base mb-3"
                            editable={!updating && hasPasswordProvider}
                        />
                        <StyledTextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="새 비밀번호 확인"
                            secureTextEntry
                            className="border border-gray-200 rounded-2xl px-4 py-3 text-base"
                            editable={!updating && hasPasswordProvider}
                        />
                        <StyledView className="mt-3 space-y-1">
                            {passwordValidators.map((validator) => {
                                const passed = validator.check(newPassword);
                                return (
                                    <StyledText
                                        key={validator.key}
                                        className={`text-xs ${passed ? "text-green-600" : "text-gray-500"}`}
                                    >
                                        {validator.message}
                                    </StyledText>
                                );
                            })}
                        </StyledView>
                    </StyledView>

                    <Button className="rounded-full" disabled={!canSubmit} onPress={handleChangePassword}>
                        {updating ? "변경 중..." : "새 비밀번호로 변경"}
                    </Button>

                    <StyledView className="mt-4">
                        <StyledText className="text-sm font-semibold text-gray-900 mb-2">
                            비밀번호를 잊으셨나요?
                        </StyledText>
                        <StyledText className="text-xs text-gray-500 mb-4">
                            이메일로 재설정 링크를 받고 싶다면 아래 버튼을 눌러주세요.
                        </StyledText>
                        <Button
                            className="rounded-full"
                            variant="outline"
                            disabled={sendingEmail || !hasPasswordProvider}
                            onPress={handleSendResetEmail}
                        >
                            {sendingEmail ? "메일 전송 중..." : "재설정 메일 보내기"}
                        </Button>
                    </StyledView>
                </StyledView>
            </KeyboardAvoidingView>
        </StyledSafeAreaView>
    );
}
