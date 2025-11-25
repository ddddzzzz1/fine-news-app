import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Button } from "../components/ui/button";
import { auth, db } from "../firebaseConfig";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useUserProfile } from "../lib/useUserProfile";
import { logAuthEvent } from "../lib/authLogger";
import { useQueryClient } from "@tanstack/react-query";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;

const getCurrentNickname = (profile, user) => {
    if (profile?.nickname) return profile.nickname;
    if (profile?.korean_name) return profile.korean_name;
    if (profile?.english_name) return profile.english_name;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "";
};

export default function AccountNicknameScreen() {
    const router = useRouter();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const queryClient = useQueryClient();
    const { data: profile } = useUserProfile(userId);
    const computedNickname = useMemo(() => getCurrentNickname(profile, currentUser), [profile, currentUser]);
    const [nickname, setNickname] = useState(computedNickname);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setNickname(computedNickname);
    }, [computedNickname]);

    if (!currentUser) {
        return (
            <StyledSafeAreaView className="flex-1 bg-white items-center justify-center px-6">
                <StyledText className="text-base text-gray-600 mb-4">
                    로그인 후 닉네임을 변경할 수 있습니다.
                </StyledText>
                <Button className="rounded-full px-6" onPress={() => router.replace("/login")}>
                    로그인하기
                </Button>
            </StyledSafeAreaView>
        );
    }

    const trimmedNickname = nickname?.trim() || "";
    const nicknameTooShort = trimmedNickname.length > 0 && trimmedNickname.length < NICKNAME_MIN;
    const nicknameTooLong = trimmedNickname.length > NICKNAME_MAX;
    const isDirty = trimmedNickname !== (computedNickname?.trim() || "");
    const canSave =
        !saving &&
        !!trimmedNickname &&
        !nicknameTooShort &&
        !nicknameTooLong &&
        /^[0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ._\-\s]+$/.test(trimmedNickname) &&
        isDirty;

    const handleSave = async () => {
        if (!currentUser || !userId) {
            Alert.alert("로그인 필요", "로그인 상태를 확인한 뒤 다시 시도해주세요.");
            return;
        }
        const nextNickname = trimmedNickname;

        if (nextNickname.length < NICKNAME_MIN || nextNickname.length > NICKNAME_MAX) {
            Alert.alert(
                "닉네임 길이를 확인해주세요",
                `${NICKNAME_MIN}자 이상 ${NICKNAME_MAX}자 이하로 입력해주세요.`
            );
            return;
        }

        if (!/^[0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ._\-\s]+$/.test(nextNickname)) {
            Alert.alert("사용할 수 없는 문자가 포함되었습니다.", "한글, 영문, 숫자, 공백, . _ - 만 입력할 수 있습니다.");
            return;
        }

        setSaving(true);
        try {
            await updateProfile(currentUser, { displayName: nextNickname });
            await setDoc(
                doc(db, "user_profiles", userId),
                {
                    nickname: nextNickname,
                    updated_at: serverTimestamp(),
                },
                { merge: true }
            );
            logAuthEvent("nickname_update_success", { uid: userId, nickname: nextNickname });
            queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
            Alert.alert("변경 완료", "닉네임이 업데이트되었습니다.", [
                { text: "확인", onPress: () => router.back() },
            ]);
        } catch (error) {
            console.log("Failed to update nickname", error);
            logAuthEvent("nickname_update_failed", { uid: userId, error });
            Alert.alert("변경 실패", "닉네임을 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" onPress={() => router.back()} className="rounded-full">
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="text-base font-semibold text-gray-900">닉네임 설정</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <StyledView className="flex-1 px-6 py-6">
                    <StyledText className="text-lg font-bold text-gray-900 mb-2">
                        프로필에 표시될 닉네임을 입력하세요
                    </StyledText>
                    <StyledText className="text-sm text-gray-500 mb-6">
                        커뮤니티, 공모전, 마이 탭에서 공통으로 사용됩니다. 개인정보가 노출되지 않도록 주의해주세요.
                    </StyledText>

                    <StyledView className="mb-3">
                        <StyledText className="text-xs text-gray-600 mb-2">닉네임</StyledText>
                        <StyledTextInput
                            value={nickname}
                            onChangeText={setNickname}
                            placeholder="예: 파인러버, 취준러"
                            autoCapitalize="none"
                            className="border border-gray-200 rounded-2xl px-4 py-3 text-base"
                            maxLength={NICKNAME_MAX + 3}
                        />
                    </StyledView>
                    <StyledText className="text-xs text-gray-500 mb-8">
                        {NICKNAME_MIN}~{NICKNAME_MAX}자, 한글/영문/숫자/공백/._- 조합만 사용할 수 있습니다.
                    </StyledText>

                    {(nicknameTooShort || nicknameTooLong) && (
                        <StyledText className="text-xs text-red-500 mb-4">
                            닉네임 길이를 다시 확인해주세요.
                        </StyledText>
                    )}

                    <Button className="rounded-full" disabled={!canSave} onPress={handleSave}>
                        {saving ? "저장 중..." : "변경사항 저장"}
                    </Button>
                </StyledView>
            </KeyboardAvoidingView>
        </StyledSafeAreaView>
    );
}
