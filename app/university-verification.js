import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Button } from "../components/ui/button";
import { auth, storage, db } from "../firebaseConfig";
import { useUserProfile } from "../lib/useUserProfile";
import { Check, UploadCloud, Info } from "lucide-react-native";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(TextInput);

const UNIVERSITY_OPTIONS = [
    "충남대학교",
    "KAIST",
    "한밭대학교",
    "한남대학교",
    "목원대학교",
    "배재대학교",
    "한국외국어대학교(서울)",
    "우송대학교",
    "공주대학교",
    "충북대학교",
];

export default function UniversityVerificationScreen() {
    const router = useRouter();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const { data: profile } = useUserProfile(userId);

    const [selectedUniversity, setSelectedUniversity] = useState(profile?.university_name || "");
    const [studentEmail, setStudentEmail] = useState(profile?.student_email_domain || "");
    const [imagePreview, setImagePreview] = useState(null);
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (profile?.university_name && !selectedUniversity) {
            setSelectedUniversity(profile.university_name);
        }
        if (profile?.student_email_domain && !studentEmail) {
            setStudentEmail(profile.student_email_domain);
        }
    }, [profile?.university_name, profile?.student_email_domain, selectedUniversity, studentEmail]);

    const hasSelection = Boolean(selectedUniversity);
    const canSubmit = hasSelection && imagePreview && !submitting;

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("권한 필요", "학생증 이미지를 업로드하려면 사진 접근 권한이 필요합니다.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.length) {
            setImagePreview(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            const fileUri = imagePreview.uri;
            const response = await fetch(fileUri);
            const blob = await response.blob();
            const fileExtension = imagePreview.fileName?.split(".").pop() || "jpg";
            const storagePath = `student-ids/${userId}/${Date.now()}.${fileExtension}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, blob, {
                contentType: imagePreview.mimeType || "image/jpeg",
            });
            const downloadUrl = await getDownloadURL(storageRef);
            await setDoc(
                doc(db, "user_profiles", userId),
                {
                    university_name: selectedUniversity,
                    student_email_domain: studentEmail,
                    verification_status: "pending",
                    student_id_image_url: downloadUrl,
                    student_id_storage_path: storagePath,
                    note: description,
                    submitted_at: serverTimestamp(),
                    display_name: currentUser.displayName || "",
                    email: currentUser.email || "",
                },
                { merge: true }
            );
            Alert.alert(
                "제출 완료",
                "학생증이 업로드되었습니다. 관리자 검토 후 결과가 안내됩니다."
            );
            router.back();
        } catch (error) {
            console.log("Verification submit failed", error);
            Alert.alert("제출 실패", "학생증을 업로드하지 못했습니다. 네트워크 상태를 확인 후 다시 시도해주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    const selectedLabel = useMemo(() => selectedUniversity || "학교를 선택하세요", [selectedUniversity]);

    if (!currentUser) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 items-center justify-center bg-white px-6">
                <StyledText className="text-base text-gray-600">로그인 후 학생 인증을 진행할 수 있습니다.</StyledText>
                <Button className="mt-4 rounded-full" onPress={() => router.replace("/login")}>
                    로그인 화면으로 이동
                </Button>
            </StyledSafeAreaView>
        );
    }

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <StyledView className="px-5 py-4 border-b border-gray-100">
                <StyledText className="text-xl font-bold text-gray-900">학생 인증</StyledText>
                <StyledText className="text-xs text-gray-500 mt-1">
                    학생증 사진과 정보를 제출하면 관리자가 순차적으로 검토합니다.
                </StyledText>
            </StyledView>

            <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
                <StyledView className="mt-5 mb-4">
                    <StyledText className="text-sm font-semibold text-gray-800 mb-3">
                        1. 학교 선택
                    </StyledText>

                    <StyledText className="text-xs text-gray-500 mb-2">
                        현재 지원 중인 학교 목록입니다. 목록에 학교가 없다면 고객센터로 문의해주세요.
                    </StyledText>

                    <FlatList
                        data={UNIVERSITY_OPTIONS}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <UniversityOption
                                label={item}
                                selected={item === selectedUniversity}
                                onPress={() => setSelectedUniversity(item)}
                            />
                        )}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <StyledView className="h-2" />}
                        ListFooterComponent={
                            <StyledView className="mt-2">
                                <StyledText className="text-xs text-gray-500">
                                    선택됨: <StyledText className="font-semibold">{selectedLabel}</StyledText>
                                </StyledText>
                            </StyledView>
                        }
                    />
                </StyledView>

                <StyledView className="mb-6">
                    <StyledText className="text-sm font-semibold text-gray-800 mb-2">
                        2. 학생 이메일 (선택)
                    </StyledText>
                    <StyledTextInput
                        value={studentEmail}
                        onChangeText={setStudentEmail}
                        placeholder="학교 이메일 주소 (@school.ac.kr)"
                        autoCapitalize="none"
                        className="border border-gray-200 rounded-xl px-3 py-2 text-base"
                    />
                </StyledView>

                <StyledView className="mb-6">
                    <StyledText className="text-sm font-semibold text-gray-800 mb-2">
                        3. 학생증 사진 업로드
                    </StyledText>
                    <StyledTouchableOpacity
                        className="border border-dashed border-gray-300 rounded-2xl p-4 items-center justify-center bg-gray-50"
                        onPress={handlePickImage}
                    >
                        {imagePreview ? (
                            <Image
                                source={{ uri: imagePreview.uri }}
                                className="w-full h-48 rounded-xl"
                                resizeMode="cover"
                            />
                        ) : (
                            <StyledView className="items-center">
                                <UploadCloud color="#4f46e5" size={28} />
                                <StyledText className="text-sm font-medium text-gray-800 mt-2">
                                    학생증 이미지를 첨부하세요
                                </StyledText>
                                <StyledText className="text-xs text-gray-500 mt-1">
                                    JPG/PNG, 개인정보 가리기 없이 선명한 사진
                                </StyledText>
                            </StyledView>
                        )}
                    </StyledTouchableOpacity>
                </StyledView>

                <StyledView className="mb-6">
                    <StyledText className="text-sm font-semibold text-gray-800 mb-2">
                        4. 추가 메모 (선택)
                    </StyledText>
                    <StyledTextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="인증에 필요한 보충 설명이 있다면 입력해주세요."
                        multiline
                        className="border border-gray-200 rounded-xl px-3 py-2 text-base"
                        textAlignVertical="top"
                        style={{ minHeight: 100 }}
                    />
                </StyledView>

                <StyledView className="flex-row items-center bg-indigo-50 border border-indigo-100 rounded-2xl px-3 py-2 mb-6">
                    <Info size={16} color="#4338ca" />
                    <StyledText className="ml-2 text-xs text-indigo-800">
                        제출 후 관리자 검토까지 최대 1~2영업일이 소요됩니다. 승인 상태는 프로필 화면에서 확인할 수 있습니다.
                    </StyledText>
                </StyledView>

                <Button
                    className="rounded-full h-12 mb-3 flex-row items-center justify-center"
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                >
                    {submitting && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
                    <StyledText className="text-white font-semibold">
                        {submitting ? "제출 중..." : "학생증 제출"}
                    </StyledText>
                </Button>
                <Button variant="outline" className="rounded-full h-12 mb-10" onPress={() => router.back()}>
                    돌아가기
                </Button>
            </ScrollView>
        </StyledSafeAreaView>
    );
}

function UniversityOption({ label, selected, onPress }) {
    return (
        <StyledTouchableOpacity
            onPress={onPress}
            className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                selected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"
            }`}
        >
            <StyledText className="text-sm text-gray-900">{label}</StyledText>
            {selected && <Check size={18} color="#4338ca" />}
        </StyledTouchableOpacity>
    );
}
