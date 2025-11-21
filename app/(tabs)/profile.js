import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Settings, ChevronRight, FileText, HelpCircle, LogOut, Bookmark, Bell } from "lucide-react-native";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { useUserProfile } from "../../lib/useUserProfile";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const FALLBACK_PROFILE = {
    university_name: "",
    verification_status: "unverified",
    student_email_domain: "",
};

export default function Profile() {
    const router = useRouter();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const email = currentUser?.email;
    const { data: userProfile } = useUserProfile(userId);
    const profile = userProfile || FALLBACK_PROFILE;

    const displayName =
        profile.korean_name ||
        profile.english_name ||
        currentUser?.displayName ||
        (email ? email.split("@")[0] : "로그인이 필요합니다");
    const university = currentUser?.photoURL || "";
    const universityName = profile.university_name || university || "미등록";
    const verificationStatus = profile.verification_status || "unverified";
    const isVerifiedStudent = verificationStatus === "verified";
    const isPendingVerification = verificationStatus === "pending";
    const statusText =
        verificationStatus === "verified"
            ? "학생 인증 완료"
            : verificationStatus === "pending"
              ? "인증 심사 중"
              : "학생 인증 필요";
    const statusBadgeClass = isVerifiedStudent
        ? "bg-green-50 text-green-700 border-0"
        : isPendingVerification
          ? "bg-amber-50 text-amber-700 border-0"
          : "bg-gray-100 text-gray-500 border-0";

    const { data: myPosts } = useQuery({
        queryKey: ["profile-posts", email],
        queryFn: async () => {
            if (!email) return [];
            try {
                const q = query(collection(db, "community_posts"), where("created_by", "==", email));
                const snapshot = await getDocs(q);
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.log("Error fetching my posts", error);
                return [];
            }
        },
        enabled: !!email,
        initialData: [],
    });

    const { data: savedContests } = useQuery({
        queryKey: ["profile-saved-contests", userId],
        queryFn: async () => {
            if (!userId) return [];
            try {
                const q = query(collection(db, "saved_contests"), where("user_id", "==", userId));
                const snapshot = await getDocs(q);
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.log("Error fetching saved contests", error);
                return [];
            }
        },
        enabled: !!userId,
        initialData: [],
    });

    const menuItems = [
        { icon: FileText, label: "내 게시글", count: myPosts?.length || 0, action: () => router.push("/my-posts") },
        { icon: Bookmark, label: "저장한 공고", count: savedContests?.length || 0, action: () => router.push("/saved-contests") },
        { icon: Bell, label: "알림 설정", count: null, action: () => router.push("/notification-settings") },
        { icon: HelpCircle, label: "도움말", count: null, action: () => router.push("/help") },
        { icon: Settings, label: "설정", count: null },
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace("/login");
        } catch (error) {
            console.log("Logout error", error);
        }
    };

    const handleRequestVerification = () => {
        router.push("/university-verification");
    };

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
            <StyledScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
                <StyledView className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center justify-between">
                    <StyledText className="text-xl font-bold text-gray-900">마이</StyledText>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Settings size={20} color="#111827" />
                    </Button>
                </StyledView>

                <StyledView className="bg-white px-6 py-6 mb-2">
                    <StyledView className="flex-row items-center mb-4">
                        <StyledView className="w-16 h-16 rounded-full bg-indigo-500 items-center justify-center">
                            <StyledText className="text-white text-2xl font-bold">
                                {displayName?.[0] || "U"}
                            </StyledText>
                        </StyledView>
                        <StyledView className="ml-4 flex-1">
                            <StyledView className="flex-row items-center mb-1">
                                <StyledText className="text-xl font-bold text-gray-900 mr-2">{displayName}</StyledText>
                                <Badge className={`${statusBadgeClass} text-xs`}>{statusText}</Badge>
                            </StyledView>
                            <StyledText className="text-sm font-semibold text-indigo-700 mb-1">{universityName}</StyledText>
                            <StyledText className="text-sm text-gray-600">{email || "로그인이 필요합니다"}</StyledText>
                        </StyledView>
                    </StyledView>
                    {currentUser && !isVerifiedStudent && (
                        <StyledView className="mt-2 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                            <StyledText className="text-xs text-amber-800 mb-2">
                                학생 인증이 완료되어야 게시글 작성, 공모전 저장 등 주요 기능이 활성화됩니다.
                                {isPendingVerification ? " 심사 중에는 관리자 검토를 기다려주세요." : ""}
                            </StyledText>
                            <Button
                                className="rounded-full bg-amber-600"
                                variant="default"
                                onPress={handleRequestVerification}
                            >
                                {isPendingVerification ? "인증 심사 중" : "학생 인증하기"}
                            </Button>
                        </StyledView>
                    )}
                </StyledView>

                <StyledView className="bg-white px-4 py-4 mb-2 flex-row">
                    <StyledView className="flex-1 items-center">
                        <StyledText className="text-2xl font-bold text-gray-900 mb-1">{myPosts?.length || 0}</StyledText>
                        <StyledText className="text-xs text-gray-600">작성 글</StyledText>
                    </StyledView>
                    <StyledView className="flex-1 items-center border-l border-r border-gray-200">
                        <StyledText className="text-2xl font-bold text-gray-900 mb-1">0</StyledText>
                        <StyledText className="text-xs text-gray-600">댓글</StyledText>
                    </StyledView>
                    <StyledView className="flex-1 items-center">
                        <StyledText className="text-2xl font-bold text-gray-900 mb-1">
                            {savedContests?.length || 0}
                        </StyledText>
                        <StyledText className="text-xs text-gray-600">저장한 공고</StyledText>
                    </StyledView>
                </StyledView>

                <StyledView className="bg-white">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <StyledTouchableOpacity
                                key={item.label}
                                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
                                onPress={item.action}
                                disabled={!item.action || !currentUser}
                            >
                                <StyledView className="flex-row items-center space-x-3">
                                    <Icon size={20} color="#4b5563" />
                                    <StyledText className="text-base text-gray-900">{item.label}</StyledText>
                                </StyledView>
                                <StyledView className="flex-row items-center space-x-2">
                                    {item.count !== null && (
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                            {item.count}
                                        </Badge>
                                    )}
                                    <ChevronRight size={18} color="#9ca3af" />
                                </StyledView>
                            </StyledTouchableOpacity>
                        );
                    })}
                </StyledView>

                {currentUser ? (
                    <StyledView className="bg-white mt-2">
                        <StyledTouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center justify-center space-x-2 py-4"
                        >
                            <LogOut size={20} color="#ef4444" />
                            <StyledText className="text-base font-semibold text-red-500">로그아웃</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>
                ) : (
                    <StyledView className="bg-white mt-2 px-4 py-6 items-center">
                        <StyledText className="text-sm text-gray-600 mb-3">로그인하고 개인화된 정보를 확인하세요.</StyledText>
                        <Button className="rounded-full px-6" onPress={() => router.push("/login")}>
                            로그인하기
                        </Button>
                    </StyledView>
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
