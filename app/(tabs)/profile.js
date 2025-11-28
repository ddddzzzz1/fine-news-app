import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { LogOut } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useUserProfile } from "../../lib/useUserProfile";
import { useAdminClaims } from "../../hooks/useAdminClaims";

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
    const navigation = useNavigation();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const email = currentUser?.email;
    const { data: userProfile } = useUserProfile(userId);
    const { isAdmin } = useAdminClaims();
    const profile = userProfile || FALLBACK_PROFILE;

    const displayName =
        (profile.nickname && profile.nickname.trim()) ||
        profile.korean_name ||
        profile.english_name ||
        currentUser?.displayName ||
        (email ? email.split("@")[0] : "로그인이 필요합니다");
    const universityName = profile.university_name || "미등록";
    const verificationStatus = profile.verification_status || "unverified";
    const isVerifiedStudent = verificationStatus === "verified" || verificationStatus === "admin";
    const isPendingVerification = verificationStatus === "pending";
    const statusText =
        verificationStatus === "verified" || verificationStatus === "admin"
            ? "학생 인증 완료"
            : verificationStatus === "pending"
              ? "인증 심사 중"
              : "학생 인증 필요";
    const statusBadgeClass = isVerifiedStudent
        ? "bg-green-50 text-green-700 border-0"
        : isPendingVerification
          ? "bg-amber-50 text-amber-700 border-0"
          : "bg-gray-100 text-gray-500 border-0";

    const { data: myPosts = [], refetch: refetchMyPosts } = useQuery({
        queryKey: ["profile-posts", email],
        queryFn: async () => {
            if (!email) return [];
            const q = query(collection(db, "community_posts"), where("created_by", "==", email));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        },
        enabled: !!email,
        initialData: [],
    });

    const { data: savedContests = [], refetch: refetchSavedContests } = useQuery({
        queryKey: ["profile-saved-contests", userId],
        queryFn: async () => {
            if (!userId) return [];
            const q = query(collection(db, "saved_contests"), where("user_id", "==", userId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        },
        enabled: !!userId,
        initialData: [],
    });

    React.useEffect(() => {
        const unsubscribe = navigation?.addListener?.("tabPress", () => {
            refetchMyPosts();
            refetchSavedContests();
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [navigation, refetchMyPosts, refetchSavedContests]);

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

    const stats = [
        { label: "작성 글", value: myPosts?.length || 0, action: () => router.push("/my-posts") },
        { label: "댓글", value: profile.comment_count || 0, action: null },
        { label: "저장", value: savedContests?.length || 0, action: () => router.push("/saved-contests") },
    ];

    const menuGroups = [
        {
            title: "내 활동",
            items: [
                { icon: "document-text-outline", label: "내 글", badge: myPosts?.length || 0, action: () => router.push("/my-posts"), color: "#4f46e5" },
                { icon: "bookmark-outline", label: "저장한 공고", badge: savedContests?.length || 0, action: () => router.push("/saved-contests"), color: "#d97706" },
                { icon: "notifications-outline", label: "알림 설정", action: () => router.push("/notification-settings"), color: "#dc2626" },
            ],
        },
        {
            title: "도움과 설정",
            items: [
                ...(isAdmin
                    ? [{ icon: "shield-checkmark-outline", label: "신고 관리", action: () => router.push("/admin/reports"), color: "#059669" }]
                    : []),
                { icon: "help-circle-outline", label: "도움말", action: () => router.push("/help"), color: "#0ea5e9" },
                { icon: "settings-outline", label: "설정", action: () => router.push("/settings"), color: "#4b5563" },
            ],
        },
    ];

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-[#F9FAFB]">
            <StyledScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
                <StyledView className="bg-white rounded-b-[32px] border-b border-gray-100 shadow-sm pb-6 pt-4">
                    <StyledView className="px-6">
                        <StyledText className="text-2xl font-bold text-gray-900 mb-6">마이 페이지</StyledText>
                        <StyledView className="flex-row items-center">
                            <StyledView className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 items-center justify-center mr-4">
                                <StyledText className="text-2xl font-bold text-indigo-600">{displayName?.[0] || "U"}</StyledText>
                            </StyledView>
                            <StyledView className="flex-1">
                                <StyledView className="flex-row items-center flex-wrap mb-1">
                                    <StyledText className="text-xl font-bold text-gray-900 mr-2">{displayName}</StyledText>
                                    <Badge className={`${statusBadgeClass} text-[10px]`}>{statusText}</Badge>
                                </StyledView>
                                <StyledText className="text-gray-500 text-sm">{email || "로그인이 필요합니다"}</StyledText>
                            </StyledView>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </StyledView>
                        <StyledView className="flex-row items-center mt-6 px-2">
                            {stats.map((stat, idx) => (
                                <React.Fragment key={stat.label}>
                                    {idx > 0 && <StyledView className="w-px h-10 bg-gray-200" />}
                                    <StyledTouchableOpacity
                                        onPress={stat.action}
                                        disabled={!stat.action}
                                        className="flex-1 items-center"
                                        activeOpacity={0.8}
                                    >
                                        <StyledText className="text-xl font-bold text-gray-900">{stat.value}</StyledText>
                                        <StyledText className="text-xs text-gray-400 font-medium mt-1">{stat.label}</StyledText>
                                    </StyledTouchableOpacity>
                                </React.Fragment>
                            ))}
                        </StyledView>
                    </StyledView>
                </StyledView>

                {currentUser && !isVerifiedStudent && (
                    <StyledView className="mx-5 mt-5 bg-white border border-amber-100 rounded-2xl p-4">
                        <StyledText className="text-sm text-amber-800 mb-2">
                            학생 인증을 완료하면 게시글 작성, 공모전 저장 등 주요 기능이 활성화됩니다.
                            {isPendingVerification ? " 심사 중에는 관리자 검토를 기다려주세요." : ""}
                        </StyledText>
                        <Button className="rounded-full" onPress={handleRequestVerification}>
                            {isPendingVerification ? "인증 심사 중" : "학생 인증하기"}
                        </Button>
                    </StyledView>
                )}

                <StyledView className="px-5 mt-6 space-y-6">
                    {menuGroups.map((group) => (
                        <StyledView key={group.title}>
                            <StyledText className="text-sm font-semibold text-gray-500 mb-2">{group.title}</StyledText>
                            <StyledView className="bg-white rounded-3xl border border-gray-100 p-2">
                                {group.items.map((item, idx) => (
                                    <TouchableOpacity
                                        key={item.label}
                                        onPress={item.action}
                                        activeOpacity={0.8}
                                        className={`flex-row items-center py-4 px-3 rounded-xl ${idx !== 0 ? "border-t border-gray-100" : ""}`}
                                    >
                                        <Ionicons name={item.icon} size={22} color={item.color} style={{ marginRight: 14 }} />
                                        <StyledText className="flex-1 text-base font-medium text-gray-700">{item.label}</StyledText>
                                        {typeof item.badge === "number" && (
                                            <StyledView className="bg-gray-100 px-2.5 py-1 rounded-full mr-2">
                                                <StyledText className="text-xs font-bold text-gray-600">{item.badge}</StyledText>
                                            </StyledView>
                                        )}
                                        <Ionicons name="chevron-forward" size={16} color="#E5E7EB" />
                                    </TouchableOpacity>
                                ))}
                            </StyledView>
                        </StyledView>
                    ))}
                </StyledView>

                {currentUser ? (
                    <StyledTouchableOpacity
                        onPress={handleLogout}
                        className="mx-5 mt-6 bg-red-50 rounded-2xl py-4 flex-row items-center justify-center space-x-2 border border-red-100"
                    >
                        <LogOut size={18} color="#ef4444" />
                        <StyledText className="text-base font-semibold text-red-500">로그아웃</StyledText>
                    </StyledTouchableOpacity>
                ) : (
                    <StyledView className="bg-white mt-6 mx-5 px-4 py-6 items-center rounded-2xl border border-gray-100">
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
