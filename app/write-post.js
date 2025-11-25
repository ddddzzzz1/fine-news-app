import React, { useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/button";
import { styled } from "nativewind";
import { useRouter } from "expo-router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, storage, ref, uploadBytesResumable, getDownloadURL } from "../firebaseConfig";
import { useQueryClient } from "@tanstack/react-query";
import { useUserProfile } from "../lib/useUserProfile";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

const MAX_IMAGE_WIDTH = 1080;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit

export default function WritePost() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const { data: userProfile, isLoading: profileLoading } = useUserProfile(userId);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const boardTypes = ["자유", "취업", "모집", "스터디"];
    const [boardType, setBoardType] = useState(boardTypes[0]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageUploadProgress, setImageUploadProgress] = useState(0);
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const verificationStatus = userProfile?.verification_status || "unverified";
    const isVerifiedStudent = verificationStatus === "verified";
    const isPendingVerification = verificationStatus === "pending";
    const universityName = userProfile?.university_name || "Fine University";

    const handlePickImage = async () => {
        try {
            setIsProcessingImage(true);
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.status !== "granted") {
                Alert.alert("권한 필요", "이미지를 첨부하려면 사진 접근 권한이 필요합니다.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                quality: 1,
            });
            if (result.canceled || !result.assets?.length) {
                return;
            }

            const asset = result.assets[0];
            const resized = await ImageManipulator.manipulateAsync(
                asset.uri,
                [{ resize: { width: Math.min(MAX_IMAGE_WIDTH, asset.width || MAX_IMAGE_WIDTH) } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            const fileInfo = await FileSystem.getInfoAsync(resized.uri);
            if (!fileInfo.exists) {
                Alert.alert("이미지 오류", "선택한 이미지를 찾을 수 없습니다. 다시 시도해주세요.");
                return;
            }
            if (fileInfo.size > MAX_IMAGE_SIZE_BYTES) {
                Alert.alert("용량 초과", "이미지 크기가 2MB를 초과합니다. 다른 이미지를 선택해주세요.");
                return;
            }

            setSelectedImage({
                uri: resized.uri,
                width: resized.width,
                height: resized.height,
                size: fileInfo.size,
                mimeType: "image/jpeg",
                originalName: asset.fileName || "community.jpg",
            });
        } catch (error) {
            console.log("Image pick failed", error);
            Alert.alert("이미지 선택 실패", "이미지를 불러오지 못했습니다. 다시 시도해주세요.");
        } finally {
            setIsProcessingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImageUploadProgress(0);
    };

    const handleSubmit = async () => {
        if (!isVerifiedStudent) {
            Alert.alert(
                "학생 인증 필요",
                isPendingVerification ? "관리자 검토가 완료되면 게시글 작성이 가능합니다." : "학생 인증 후에만 게시글을 작성할 수 있습니다."
            );
            return;
        }
        if (!title.trim() || !content.trim()) {
            Alert.alert("작성 오류", "제목과 내용을 모두 입력해주세요.");
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        setImageUploadProgress(0);
        try {
            let uploadedImageData = null;
            if (selectedImage) {
                const fileResponse = await fetch(selectedImage.uri);
                const blob = await fileResponse.blob();
                const storagePath = `community_posts/${userId || "anonymous"}/${Date.now()}.jpg`;
                const storageRef = ref(storage, storagePath);
                await new Promise((resolve, reject) => {
                    const uploadTask = uploadBytesResumable(storageRef, blob, {
                        contentType: selectedImage.mimeType || "image/jpeg",
                    });
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = snapshot.bytesTransferred / snapshot.totalBytes;
                            setImageUploadProgress(progress);
                        },
                        (error) => reject(error),
                        async () => {
                            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            uploadedImageData = {
                                image_url: downloadUrl,
                                image_meta: {
                                    width: selectedImage.width,
                                    height: selectedImage.height,
                                    size: selectedImage.size,
                                    storage_path: storagePath,
                                },
                            };
                            resolve();
                        }
                    );
                });
            }

            await addDoc(collection(db, "community_posts"), {
                title: title.trim(),
                content: content.trim(),
                board_type: boardType,
                university: universityName,
                user_id: userId || "anonymous",
                created_by: currentUser?.email || "demo@example.com",
                created_date: serverTimestamp(),
                liked_users: [],
                like_count: 0,
                comments: [],
                comment_count: 0,
                ...(uploadedImageData || {}),
            });

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["home-community-posts"] }),
                queryClient.invalidateQueries({ queryKey: ["tab-community-posts"] }),
            ]);

            router.back();
        } catch (error) {
            console.log("Failed to create post", error);
            Alert.alert("오류", "게시글을 저장하지 못했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
            setImageUploadProgress(0);
        }
    };

    const restrictionMessage =
        verificationStatus === "pending"
            ? "학생 인증 심사 중입니다. 검토가 완료되면 작성 기능이 자동으로 활성화됩니다."
            : "학생 인증 후에 게시글을 작성할 수 있습니다.";

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white px-4 py-4">
            <StyledView className="flex-row items-center justify-between mb-6">
                <StyledText className="text-xl font-bold text-gray-900">게시글 작성</StyledText>
                <Button variant="ghost" onPress={() => router.back()}>
                    취소
                </Button>
            </StyledView>
            <StyledView className="space-y-4 flex-1">
                {!isVerifiedStudent && !profileLoading && (
                    <StyledView className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                        <StyledText className="text-xs text-amber-800">{restrictionMessage}</StyledText>
                    </StyledView>
                )}
                <StyledView>
                    <StyledText className="text-sm font-medium text-gray-700 mb-2">게시판</StyledText>
                    <StyledView className="flex-row space-x-2">
                        {boardTypes.map((type) => (
                            <StyledTouchableOpacity
                                key={type}
                                onPress={() => setBoardType(type)}
                                className={`px-3 py-1.5 rounded-full border ${
                                    boardType === type ? "bg-indigo-600 border-indigo-600" : "border-gray-200"
                                }`}
                            >
                                <StyledText className={boardType === type ? "text-white text-sm" : "text-gray-700 text-sm"}>
                                    {type}
                                </StyledText>
                            </StyledTouchableOpacity>
                        ))}
                    </StyledView>
                </StyledView>

                <StyledView>
                    <StyledText className="text-sm font-medium text-gray-700 mb-2">제목</StyledText>
                    <StyledTextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="제목을 입력하세요"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-base"
                    />
                </StyledView>

                <StyledView className="flex-1">
                    <StyledText className="text-sm font-medium text-gray-700 mb-2">내용</StyledText>
                    <StyledTextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder="내용을 입력하세요"
                        multiline
                        textAlignVertical="top"
                        className="border border-gray-200 rounded-lg px-3 py-2 h-full"
                    />
                </StyledView>

                <StyledView className="mt-4">
                    <StyledText className="text-sm font-medium text-gray-700 mb-2">이미지 첨부 (선택)</StyledText>
                    <StyledView className="space-y-3">
                        <StyledTouchableOpacity
                            onPress={handlePickImage}
                            disabled={isProcessingImage}
                            className={`border border-dashed rounded-2xl px-4 py-6 items-center justify-center ${
                                selectedImage ? "border-indigo-200 bg-indigo-50" : "border-gray-300 bg-gray-50"
                            }`}
                        >
                            {selectedImage ? (
                                <StyledView className="w-full">
                                    <StyledImage
                                        source={{ uri: selectedImage.uri }}
                                        className="w-full rounded-xl mb-3"
                                        style={{
                                            aspectRatio:
                                                selectedImage.width && selectedImage.height
                                                    ? selectedImage.width / selectedImage.height
                                                    : 4 / 3,
                                        }}
                                        resizeMode="cover"
                                    />
                                    <StyledText className="text-xs text-gray-600">
                                        {(selectedImage.size / 1024).toFixed(0)}KB · {selectedImage.width}x{selectedImage.height}
                                    </StyledText>
                                </StyledView>
                            ) : (
                                <StyledText className="text-sm text-gray-600">
                                    {isProcessingImage ? "이미지를 준비중입니다..." : "갤러리에서 이미지를 선택하세요"}
                                </StyledText>
                            )}
                        </StyledTouchableOpacity>
                        {selectedImage && (
                            <StyledView className="flex-row items-center justify-between">
                                <Button variant="ghost" onPress={handleRemoveImage}>
                                    이미지 제거
                                </Button>
                                {imageUploadProgress > 0 && imageUploadProgress < 1 && (
                                    <StyledText className="text-xs text-gray-500">
                                        업로드 준비 중... {(imageUploadProgress * 100).toFixed(0)}%
                                    </StyledText>
                                )}
                            </StyledView>
                        )}
                    </StyledView>
                </StyledView>
            </StyledView>

            <Button
                className="w-full mt-4 h-12 rounded-full"
                disabled={isSubmitting || !isVerifiedStudent}
                onPress={handleSubmit}
            >
                {isVerifiedStudent ? (isSubmitting ? "작성 중..." : "작성하기") : "학생 인증 필요"}
            </Button>
        </StyledSafeAreaView>
    );
}
