import React, { useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Button } from "../components/ui/button";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    signOut,
} from "firebase/auth";

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
            const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
            if (trimmedName) {
                await updateProfile(userCredential.user, { displayName: trimmedName });
            }
            await sendEmailVerification(userCredential.user);
            Alert.alert(
                "회원가입 완료",
                "가입하신 이메일로 인증 메일을 보냈습니다. 인증 후 다시 로그인해주세요."
            );
            await signOut(auth);
            router.replace("/login");
        } catch (error) {
            console.log("Registration failed", error);
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
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white px-6 py-8">
            <StyledView className="flex-1">
                <StyledText className="text-3xl font-bold text-gray-900 mb-6">회원가입</StyledText>

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
