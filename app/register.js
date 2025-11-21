import React, { useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    signOut,
} from "firebase/auth";
import { logAuthEvent, isTestAccountEmail } from "../lib/authLogger";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);

const passwordValidators = [
    {
        key: "length",
        message: "6~12자 사이로 입력하세요",
        check: (password) => password.length >= 6 && password.length <= 12,
    },
    {
        key: "lower",
        message: "소문자를 포함해야 합니다",
        check: (password) => /[a-z]/.test(password),
    },
    {
        key: "number",
        message: "숫자를 포함해야 합니다",
        check: (password) => /\d/.test(password),
    },
];

export default function Register() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const validatePassword = (value) =>
        passwordValidators.every((validator) => validator.check(value));

    const getVerificationPrompt = async (user, normalizedEmail) => {
        if (!user) {
            logAuthEvent("sign_up_verification_skipped_no_user", { email: normalizedEmail });
            return {
                title: "회원가입 완료",
                message: "계정이 생성되었지만 사용자 정보를 확인할 수 없습니다. 로그인 화면에서 다시 시도해주세요.",
            };
        }

        if (user.emailVerified) {
            logAuthEvent("sign_up_email_already_verified", {
                email: normalizedEmail,
                uid: user.uid,
            });
            return {
                title: "이미 인증 완료",
                message: `해당 이메일(${normalizedEmail})은 이미 인증되어 있습니다. 바로 로그인해주세요.`,
            };
        }

        const isTestAccount = isTestAccountEmail(normalizedEmail);
        const testAccountNote = isTestAccount
            ? "\n테스트 계정: 인증 메일이 도착했는지 받은 편지함을 확인해주세요."
            : "";

        try {
            await sendEmailVerification(user);
            logAuthEvent("sign_up_email_verification_sent", {
                email: normalizedEmail,
                uid: user.uid,
                isTestAccount,
            });
            return {
                title: "회원가입 완료",
                message: `가입하신 이메일로 인증 메일을 보냈습니다. 인증 후 다시 로그인해주세요.${testAccountNote}`,
            };
        } catch (verificationError) {
            logAuthEvent("sign_up_email_verification_failed", {
                email: normalizedEmail,
                uid: user.uid,
                code: verificationError?.code,
                message: verificationError?.message,
            });
            return {
                title: "인증 메일 발송 실패",
                message: "계정은 생성되었지만 인증 메일을 보내지 못했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해주세요.",
            };
        }
    };

    const handleRegister = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = displayName.trim();
        if (!trimmedName) {
            Alert.alert("입력 오류", "이름을 입력해주세요.");
            return;
        }
        if (!trimmedEmail) {
            Alert.alert("입력 오류", "이메일을 입력해주세요.");
            return;
        }
        if (!password) {
            Alert.alert("입력 오류", "비밀번호를 입력해주세요.");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("입력 오류", "비밀번호가 일치하지 않습니다.");
            return;
        }
        if (!validatePassword(password)) {
            const failedRules = passwordValidators
                .filter((validator) => !validator.check(password))
                .map((validator) => `• ${validator.message}`)
                .join("\n");
            Alert.alert("비밀번호 규칙을 확인해주세요", failedRules);
            return;
        }
        setLoading(true);
        try {
            logAuthEvent("sign_up_attempt", { email: trimmedEmail });
            const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
            logAuthEvent("sign_up_success", {
                email: trimmedEmail,
                uid: userCredential.user?.uid,
            });

            const verificationPrompt = await getVerificationPrompt(userCredential.user, trimmedEmail);

            if (trimmedName) {
                try {
                    await updateProfile(userCredential.user, { displayName: trimmedName });
                    logAuthEvent("sign_up_profile_updated", {
                        uid: userCredential.user.uid,
                    });
                } catch (profileError) {
                    logAuthEvent("sign_up_profile_update_failed", {
                        uid: userCredential.user?.uid,
                        code: profileError?.code,
                        message: profileError?.message,
                    });
                }
            }

            Alert.alert(verificationPrompt.title, verificationPrompt.message);
            await signOut(auth);
            router.replace("/login");
        } catch (error) {
            logAuthEvent("sign_up_failed", {
                email: trimmedEmail,
                code: error?.code,
                message: error?.message,
            });
            let message = "회원가입에 실패했습니다. 다시 시도해주세요.";
            if (error.code === "auth/email-already-in-use") {
                message = "이미 사용 중인 이메일입니다.";
            } else if (error.code === "auth/invalid-email") {
                message = "올바른 이메일 형식을 입력해주세요.";
            } else if (error.code === "auth/weak-password") {
                message = "비밀번호가 너무 약합니다.";
            }
            Alert.alert("회원가입 실패", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button
                    variant="ghost"
                    size="icon"
                    onPress={() => router.back()}
                    className="rounded-full"
                >
                    <ArrowLeft size={24} color="#000" />
                </Button>
                <StyledView style={{ width: 40 }} />
            </StyledView>

            <StyledView className="flex-1 px-6 py-8">
                <StyledText className="text-3xl font-bold text-gray-900 mb-4">회원가입</StyledText>

                <StyledView className="mb-4">
                    <StyledText className="text-sm text-gray-700 mb-2">이름</StyledText>
                    <StyledTextInput
                        placeholder="이름을 입력하세요"
                        value={displayName}
                        onChangeText={setDisplayName}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-base"
                    />
                </StyledView>

                <StyledView className="mb-4">
                    <StyledText className="text-sm text-gray-700 mb-2">이메일</StyledText>
                    <StyledTextInput
                        placeholder="example@fine.app"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-base"
                    />
                </StyledView>

                <StyledView className="mb-4">
                    <StyledText className="text-sm text-gray-700 mb-2">비밀번호</StyledText>
                    <StyledTextInput
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        className="border border-gray-200 rounded-lg px-3 py-2 text-base"
                    />
                </StyledView>

                <StyledView className="mb-6">
                    <StyledText className="text-sm text-gray-700 mb-2">비밀번호 확인</StyledText>
                    <StyledTextInput
                        placeholder="비밀번호를 다시 입력하세요"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        className="border border-gray-200 rounded-lg px-3 py-2 text-base"
                    />
                </StyledView>

                <StyledView className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-6">
                    <StyledText className="text-xs text-gray-500 mb-2">비밀번호 정책</StyledText>
                    {passwordValidators.map((validator) => {
                        const passed = validator.check(password);
                        return (
                            <StyledText key={validator.key} className={passed ? "text-xs text-green-600" : "text-xs text-gray-500"}>
                                {passed ? "✓" : "•"} {validator.message}
                            </StyledText>
                        );
                    })}
                </StyledView>

                <Button className="w-full rounded-full h-12" disabled={loading} onPress={handleRegister}>
                    {loading ? "가입 중..." : "가입하기"}
                </Button>

                <StyledView className="flex-row justify-center mt-6">
                    <StyledText className="text-xs text-gray-500">이미 계정이 있으신가요? </StyledText>
                    <TouchableOpacity onPress={() => router.replace("/login")}>
                        <StyledText className="text-xs font-semibold text-indigo-600">로그인</StyledText>
                    </TouchableOpacity>
                </StyledView>
            </StyledView>
        </StyledSafeAreaView>
    );
}
