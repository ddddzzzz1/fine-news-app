import React, { useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity, Image, ScrollView } from "react-native";
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
    const [selectedImages, setSelectedImages] = useState([]);
    const [imageUploadProgress, setImageUploadProgress] = useState(0);
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const verificationStatus = userProfile?.verification_status || "unverified";
    const isVerifiedStudent = verificationStatus === "verified" || verificationStatus === "admin";
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
                allowsEditing: false, // Multi-selection doesn't support editing usually
                allowsMultipleSelection: true,
                selectionLimit: 5, // Limit to 5 images
                quality: 0.8,
            });
            if (result.canceled || !result.assets?.length) {
                return;
            }

            const newImages = [];
            for (const asset of result.assets) {
                // Resize if needed (optional, but good for performance)
                const resized = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: Math.min(MAX_IMAGE_WIDTH, asset.width || MAX_IMAGE_WIDTH) } }],
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );

                const fileInfo = await FileSystem.getInfoAsync(resized.uri);
                if (fileInfo.exists && fileInfo.size <= MAX_IMAGE_SIZE_BYTES) {
                    newImages.push({
                        uri: resized.uri,
                        width: resized.width,
                        height: resized.height,
                        size: fileInfo.size,
                        mimeType: "image/jpeg",
                        originalName: asset.fileName || `image_${Date.now()}.jpg`,
                    });
                }
            }

            if (newImages.length > 0) {
                setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 total
            }

        } catch (error) {
            console.log("Image pick failed", error);
            Alert.alert("이미지 선택 실패", "이미지를 불러오지 못했습니다. 다시 시도해주세요.");
        } finally {
            setIsProcessingImage(false);
        }
    };

    const handleRemoveImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
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
            const uploadedImages = [];

            if (selectedImages.length > 0) {
                const totalImages = selectedImages.length;
                let completed = 0;

                // Upload images in parallel
                await Promise.all(selectedImages.map(async (img, index) => {
                    const fileResponse = await fetch(img.uri);
                    const blob = await fileResponse.blob();
                    const storagePath = `community_posts/${userId || "anonymous"}/${Date.now()}_${index}.jpg`;
                    const storageRef = ref(storage, storagePath);

                    await uploadBytesResumable(storageRef, blob, {
                        contentType: img.mimeType || "image/jpeg",
                    });

                    const downloadUrl = await getDownloadURL(storageRef);
                    uploadedImages.push({
                        url: downloadUrl,
                        meta: {
                            width: img.width,
                            height: img.height,
                            size: img.size,
                            storage_path: storagePath,
                        }
                    });

                    completed++;
                    setImageUploadProgress(completed / totalImages);
                }));
            }

            // Prepare post data
            const postData = {
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
                images: uploadedImages, // New array field
            };

            // Backward compatibility: Set image_url to the first image
            if (uploadedImages.length > 0) {
                postData.image_url = uploadedImages[0].url;
                postData.image_meta = uploadedImages[0].meta;
            }

            await addDoc(collection(db, "community_posts"), postData);

            await Promise.all([
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
                                className={`px-3 py-1.5 rounded-full border ${boardType === type ? "bg-indigo-600 border-indigo-600" : "border-gray-200"
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
                    <StyledView className="flex-row justify-between items-center mb-2">
                        <StyledText className="text-sm font-medium text-gray-700">이미지 첨부 ({selectedImages.length}/5)</StyledText>
                        {imageUploadProgress > 0 && imageUploadProgress < 1 && (
                            <StyledText className="text-xs text-indigo-600">
                                업로드 중... {(imageUploadProgress * 100).toFixed(0)}%
                            </StyledText>
                        )}
                    </StyledView>

                    <View className="flex-row">
                        <StyledTouchableOpacity
                            onPress={handlePickImage}
                            disabled={isProcessingImage || selectedImages.length >= 5}
                            className={`w-20 h-20 border border-dashed rounded-xl items-center justify-center mr-3 ${selectedImages.length >= 5 ? "bg-gray-100 border-gray-200" : "bg-gray-50 border-gray-300"
                                }`}
                        >
                            <StyledText className="text-2xl text-gray-400">+</StyledText>
                        </StyledTouchableOpacity>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {selectedImages.map((img, index) => (
                                <StyledView key={index} className="w-20 h-20 mr-3 relative">
                                    <StyledImage
                                        source={{ uri: img.uri }}
                                        className="w-full h-full rounded-xl"
                                        resizeMode="cover"
                                    />
                                    <StyledTouchableOpacity
                                        onPress={() => handleRemoveImage(index)}
                                        className="absolute -top-2 -right-2 bg-gray-900 rounded-full w-5 h-5 items-center justify-center"
                                    >
                                        <StyledText className="text-white text-xs font-bold">X</StyledText>
                                    </StyledTouchableOpacity>
                                </StyledView>
                            ))}
                        </ScrollView>
                    </View>
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
