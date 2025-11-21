import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react-native";
import { auth } from "../firebaseConfig";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithCredential,
    sendEmailVerification,
    signOut,
} from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState(process.env.EXPO_PUBLIC_TEST_EMAIL || "");
    const [password, setPassword] = useState(process.env.EXPO_PUBLIC_TEST_PASSWORD || "");
    const [loading, setLoading] = useState(false);

    const baseGoogleConfig = {
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || undefined,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
    };

    const googleConfig = {
        expoClientId: baseGoogleConfig.expoClientId,
        iosClientId: baseGoogleConfig.iosClientId || baseGoogleConfig.expoClientId,
        androidClientId: baseGoogleConfig.androidClientId || baseGoogleConfig.expoClientId,
        webClientId: baseGoogleConfig.webClientId || baseGoogleConfig.expoClientId,
    };

    const hasGoogleConfig = Boolean(
        googleConfig.expoClientId ||
            googleConfig.iosClientId ||
            googleConfig.androidClientId ||
            googleConfig.webClientId
    );

    const handleLoginSuccess = () => {
        router.replace("/");
    };

    const handleEmailLogin = async () => {
        const trimmedEmail = email.trim();
        console.log("Email login attempt:", { email: trimmedEmail });

        if (!trimmedEmail || !password) {
            Alert.alert("로그인 오류", "이메일과 비밀번호를 입력해주세요.");
            return;
        }

        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
        if (!isValidEmail) {
            Alert.alert("로그인 오류", "올바른 이메일 형식을 입력해주세요.");
            console.log("Invalid email format provided:", trimmedEmail);
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
            if (!userCredential.user.emailVerified) {
                try {
                    await sendEmailVerification(userCredential.user);
                } catch (verificationError) {
                    console.log("Resend verification email failed", verificationError);
                }
                await signOut(auth);
                Alert.alert(
                    "이메일 인증 필요",
                    "가입 시 입력한 이메일로 인증 메일을 보냈습니다. 인증 후 다시 로그인해주세요."
                );
                return;
            }
            handleLoginSuccess();
        } catch (error) {
            console.log("Email sign-in failed", {
                code: error?.code,
                message: error?.message,
                email: trimmedEmail,
            });
            const errorMessage =
                error?.code === "auth/invalid-email"
                    ? "올바른 이메일 형식을 입력해주세요."
                    : "이메일 혹은 비밀번호를 확인해주세요.";
            Alert.alert("로그인 실패", errorMessage);
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
                <StyledView className="flex-1 justify-center">
                    <StyledText className="text-3xl font-bold text-gray-900 mb-4">로그인</StyledText>

                    <StyledView className="space-y-4 mb-6">
                        <StyledView>
                            <StyledText className="text-sm text-gray-700 mb-2">이메일</StyledText>
                            <StyledTextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="이메일을 입력하세요"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-base"
                            />
                        </StyledView>
                        <StyledView>
                            <StyledText className="text-sm text-gray-700 mb-2">비밀번호</StyledText>
                            <StyledTextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="비밀번호를 입력하세요"
                                secureTextEntry
                                className="border border-gray-200 rounded-lg px-3 py-2 text-base"
                            />
                        </StyledView>
                    </StyledView>

                    <Button className="w-full h-12 rounded-full mb-4" disabled={loading} onPress={handleEmailLogin}>
                        {loading ? "로그인 중..." : "이메일로 로그인"}
                    </Button>

                    <StyledText className="text-center text-xs text-gray-400 my-4">또는</StyledText>

                    {hasGoogleConfig && <GoogleLoginButton config={googleConfig} onSuccess={handleLoginSuccess} />}

                    <StyledView className="flex-row justify-center mt-6">
                        <StyledText className="text-xs text-gray-500">아직 계정이 없나요? </StyledText>
                        <StyledTouchableOpacity onPress={() => router.push("/register")}>
                            <StyledText className="text-xs font-semibold text-indigo-600">회원가입</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>
                </StyledView>
            </StyledView>
        </StyledSafeAreaView>
    );
}

function GoogleLoginButton({ config, onSuccess }) {
    const isExpoGo = Constants.appOwnership === "expo";
    const expoRedirectUri = "https://auth.expo.io/@fine_expo/fine-news-app";
    const authRequestConfig = isExpoGo ? { ...config, redirectUri: expoRedirectUri } : config;
    console.log("Google login redirect:", {
        redirectUri: authRequestConfig.redirectUri ?? "(native default)",
        appOwnership: Constants.appOwnership,
    });

    const [request, response, promptAsync] = Google.useAuthRequest(authRequestConfig);

    useEffect(() => {
        if (response?.type === "success") {
            const { authentication } = response;
            if (authentication?.idToken) {
                const credential = GoogleAuthProvider.credential(authentication.idToken);
                signInWithCredential(auth, credential)
                    .then(() => {
                        onSuccess?.();
                    })
                    .catch((error) => {
                        console.log("Google sign-in failed", error);
                        Alert.alert("로그인 실패", "Google 인증에 실패했습니다.");
                    });
            }
        }
    }, [response]);

    return (
        <Button
            className="w-full h-12 rounded-full bg-white border border-gray-200"
            disabled={!request}
            onPress={() => promptAsync()}
        >
            <StyledText className="text-sm text-gray-800">
                {request ? "Google 계정으로 로그인" : "Google 설정 필요"}
            </StyledText>
        </Button>
    );
}
