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
    sendPasswordResetEmail,
} from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { logAuthEvent, isTestAccountEmail } from "../lib/authLogger";

WebBrowser.maybeCompleteAuthSession();

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

const isValidEmailFormat = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState(process.env.EXPO_PUBLIC_TEST_EMAIL || "");
    const [password, setPassword] = useState(process.env.EXPO_PUBLIC_TEST_PASSWORD || "");
    const [loading, setLoading] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);

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
        const trimmedEmail = email.trim().toLowerCase();
        logAuthEvent("email_login_attempt", { email: trimmedEmail });

        if (!trimmedEmail || !password) {
            Alert.alert("로그인 오류", "이메일과 비밀번호를 입력해주세요.");
            return;
        }

        if (!isValidEmailFormat(trimmedEmail)) {
            Alert.alert("로그인 오류", "올바른 이메일 형식을 입력해주세요.");
            logAuthEvent("email_login_invalid_format", { email: trimmedEmail });
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
            const { user } = userCredential;
            logAuthEvent("email_login_authenticated", {
                email: trimmedEmail,
                uid: user?.uid,
            });

            if (!user.emailVerified) {
                try {
                    await sendEmailVerification(user);
                    logAuthEvent("email_login_verification_resent", {
                        email: trimmedEmail,
                        uid: user.uid,
                        isTestAccount: isTestAccountEmail(trimmedEmail),
                    });
                } catch (verificationError) {
                    logAuthEvent("email_login_verification_resend_failed", {
                        email: trimmedEmail,
                        uid: user?.uid,
                        code: verificationError?.code,
                        message: verificationError?.message,
                    });
                }

                try {
                    await signOut(auth);
                } catch (signOutError) {
                    logAuthEvent("email_login_signout_after_verification_failed", {
                        email: trimmedEmail,
                        uid: user?.uid,
                        code: signOutError?.code,
                        message: signOutError?.message,
                    });
                }

                const verificationNote = isTestAccountEmail(trimmedEmail)
                    ? "\n테스트 계정: 받은 편지함을 확인하여 메일 수신 여부를 기록해주세요."
                    : "";
                Alert.alert(
                    "이메일 인증 필요",
                    `가입 시 입력한 이메일로 인증 메일을 보냈습니다. 인증 후 다시 로그인해주세요.${verificationNote}`
                );
                return;
            }
            logAuthEvent("email_login_success", {
                email: trimmedEmail,
                uid: user.uid,
            });
            handleLoginSuccess();
        } catch (error) {
            logAuthEvent("email_login_failed", {
                email: trimmedEmail,
                code: error?.code,
                message: error?.message,
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

    const handlePasswordReset = async () => {
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail) {
            Alert.alert("이메일 필요", "비밀번호 초기화를 위해 이메일을 입력해주세요.");
            return;
        }

        if (!isValidEmailFormat(trimmedEmail)) {
            Alert.alert("이메일 오류", "올바른 이메일 형식을 입력해주세요.");
            return;
        }

        setResettingPassword(true);
        try {
            await sendPasswordResetEmail(auth, trimmedEmail);
            const isTestAccount = isTestAccountEmail(trimmedEmail);
            logAuthEvent("password_reset_email_sent", {
                email: trimmedEmail,
                isTestAccount,
            });

            const testAccountNote = isTestAccount
                ? "\n테스트 계정: 메일 수신 여부를 확인하고 기록해주세요."
                : "";
            Alert.alert(
                "비밀번호 초기화 메일 발송",
                `입력하신 이메일로 비밀번호 초기화 메일을 보냈습니다.${testAccountNote}`
            );
        } catch (error) {
            logAuthEvent("password_reset_email_failed", {
                email: trimmedEmail,
                code: error?.code,
                message: error?.message,
            });
            let errorMessage = "비밀번호 초기화 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.";
            if (error.code === "auth/user-not-found") {
                errorMessage = "가입된 이메일을 찾을 수 없습니다.";
            }
            Alert.alert("비밀번호 초기화 실패", errorMessage);
        } finally {
            setResettingPassword(false);
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

                    <Button
                        className="w-full h-12 rounded-full mb-2"
                        disabled={loading || resettingPassword}
                        onPress={handleEmailLogin}
                    >
                        {loading ? "로그인 중..." : "이메일로 로그인"}
                    </Button>

                    <Button
                        className="w-full h-12 rounded-full mb-4"
                        variant="outline"
                        disabled={resettingPassword || loading}
                        onPress={handlePasswordReset}
                    >
                        {resettingPassword ? "메일 발송 중..." : "비밀번호 초기화"}
                    </Button>

                    <StyledText className="text-center text-xs text-gray-400 my-4">또는</StyledText>

                    {hasGoogleConfig && (
                        <GoogleLoginButton config={googleConfig} onSuccess={handleLoginSuccess} />
                    )}

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
    logAuthEvent("google_login_redirect_info", {
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
                        logAuthEvent("google_login_success", {
                            uid: auth.currentUser?.uid,
                        });
                        onSuccess?.();
                    })
                    .catch((error) => {
                        logAuthEvent("google_login_failed", {
                            code: error?.code,
                            message: error?.message,
                        });
                        Alert.alert("로그인 실패", "Google 인증에 실패했습니다.");
                    });
            } else {
                logAuthEvent("google_login_missing_token", {});
            }
        } else if (response?.type === "error") {
            logAuthEvent("google_login_response_error", {
                error: response?.error,
            });
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
