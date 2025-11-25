import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Stack, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    collection,
    getDocs,
    orderBy,
    query,
    updateDoc,
    doc,
    deleteDoc,
    increment,
    getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { useAdminClaims } from "../../hooks/useAdminClaims";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft } from "lucide-react-native";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);

export default function AdminReports() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isAdmin, isAdminLoading } = useAdminClaims();
    const currentUser = auth.currentUser;

    const { data: reports = [], isLoading } = useQuery({
        queryKey: ["admin-community-reports"],
        enabled: !!isAdmin,
        queryFn: async () => {
            const reportsRef = collection(db, "community_reports");
            const q = query(reportsRef, orderBy("created_at", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        },
    });

    const handleUpdateStatus = async (reportId, nextStatus) => {
        try {
            await updateDoc(doc(db, "community_reports", reportId), {
                status: nextStatus,
                handled_by: currentUser?.uid || null,
                handled_at: new Date(),
            });
            queryClient.invalidateQueries({ queryKey: ["admin-community-reports"] });
            Alert.alert("상태 업데이트", "신고 상태를 업데이트했습니다.");
        } catch (error) {
            console.log("Failed to update report", error);
            Alert.alert("오류", "신고 상태를 변경하지 못했습니다.");
        }
    };

    const handleDeleteReport = (reportId) => {
        Alert.alert("신고 삭제", "이 신고 내역을 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, "community_reports", reportId));
                        queryClient.invalidateQueries({ queryKey: ["admin-community-reports"] });
                        Alert.alert("삭제 완료", "신고 내역을 삭제했습니다.");
                    } catch (error) {
                        console.log("Failed to delete report", error);
                        Alert.alert("오류", "신고 내역을 삭제하지 못했습니다.");
                    }
                },
            },
        ]);
    };

    if (isAdminLoading) {
        return (
            <StyledSafeAreaView className="flex-1 bg-white items-center justify-center">
                <Skeleton className="w-32 h-6" />
            </StyledSafeAreaView>
        );
    }

    if (!isAdmin) {
        return (
            <StyledSafeAreaView className="flex-1 bg-white items-center justify-center px-6">
                <StyledText className="text-base text-gray-600 mb-4">관리자 권한이 있는 계정으로 로그인해주세요.</StyledText>
                <Button className="rounded-full px-6" onPress={() => router.replace("/login")}>
                    로그인하기
                </Button>
            </StyledSafeAreaView>
        );
    }

    const handleDeletePost = (report) => {
        if (!report?.post_id) return;
        Alert.alert("게시글 삭제", "이 신고된 게시글을 Firestore에서 삭제할까요?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, "community_posts", report.post_id));
                        await handleUpdateStatus(report.id, "resolved");
                        Alert.alert("삭제 완료", "게시글을 삭제했습니다.");
                    } catch (error) {
                        console.log("Failed to delete post", error);
                        Alert.alert("오류", "게시글을 삭제하지 못했습니다.");
                    }
                },
            },
        ]);
    };

    const handleDeleteComment = (report) => {
        if (!report?.post_id || !report?.comment_id) return;
        Alert.alert("댓글 삭제", "이 신고된 댓글을 삭제할까요?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    try {
                        const postRef = doc(db, "community_posts", report.post_id);
                        const postSnap = await getDoc(postRef);
                        if (!postSnap.exists()) {
                            Alert.alert("오류", "원본 게시글을 찾지 못했습니다.");
                            return;
                        }
                        const postData = postSnap.data();
                        const updatedComments = (postData.comments || []).filter((c) => c.id !== report.comment_id);
                        await updateDoc(postRef, {
                            comments: updatedComments,
                            comment_count: increment(-1),
                        });
                        await handleUpdateStatus(report.id, "resolved");
                        Alert.alert("삭제 완료", "댓글을 삭제했습니다.");
                    } catch (error) {
                        console.log("Failed to delete comment", error);
                        Alert.alert("오류", "댓글을 삭제하지 못했습니다.");
                    }
                },
            },
        ]);
    };

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />
            <StyledView className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                    <ChevronLeft size={20} color="#111827" />
                </Button>
                <StyledText className="text-lg font-semibold text-gray-900">신고 관리</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 32 }}>
                {isLoading ? (
                    <StyledView className="space-y-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-24 w-full" />
                        ))}
                    </StyledView>
                ) : reports.length === 0 ? (
                    <StyledView className="mt-20 items-center">
                        <StyledText className="text-sm text-gray-500">신고가 없습니다.</StyledText>
                    </StyledView>
                ) : (
                    reports.map((report) => (
                        <StyledView key={report.id} className="bg-white rounded-2xl px-4 py-4 mb-3 shadow-sm border border-gray-100">
                            <StyledView className="flex-row items-center justify-between mb-2">
                                <Badge
                                    variant="secondary"
                                    className="bg-gray-100 text-gray-700"
                                >{`${report.type === "comment" ? "댓글" : "게시글"} 신고`}</Badge>
                                <StyledText className="text-xs text-gray-500">
                                    {report.created_at?.toDate
                                        ? formatDistanceToNow(report.created_at.toDate(), { addSuffix: true, locale: ko })
                                        : ""}
                                </StyledText>
                            </StyledView>
                            <StyledText className="text-sm font-semibold text-gray-900 mb-1">
                                사유: {translateReason(report.reason)}
                            </StyledText>
                            <StyledText className="text-xs text-gray-500 mb-2">상태: {report.status}</StyledText>
                            {report.snapshot?.post?.title && (
                                <StyledText className="text-sm text-gray-800 mb-1">
                                    제목: {report.snapshot.post.title}
                                </StyledText>
                            )}
                            {report.type === "comment" && report.snapshot?.comment?.content && (
                                <StyledText className="text-sm text-gray-700 mb-2">
                                    댓글: {report.snapshot.comment.content}
                                </StyledText>
                            )}
                            <StyledView className="flex-row flex-wrap mt-3">
                                {report.status !== "reviewed" && (
                                    <Button
                                        variant="secondary"
                                        className="flex-1 rounded-full mr-3 mb-2"
                                        onPress={() => handleUpdateStatus(report.id, "reviewed")}
                                    >
                                        검토 완료
                                    </Button>
                                )}
                                {report.status !== "resolved" && (
                                    <Button
                                        className="flex-1 rounded-full mr-3 mb-2"
                                        onPress={() => handleUpdateStatus(report.id, "resolved")}
                                    >
                                        조치 완료
                                    </Button>
                                )}
                                {report.type === "comment" && (
                                    <Button
                                        variant="destructive"
                                        className="flex-1 rounded-full mr-3 mb-2"
                                        onPress={() => handleDeleteComment(report)}
                                    >
                                        댓글 삭제
                                    </Button>
                                )}
                                {report.type !== "comment" && (
                                    <Button
                                        variant="destructive"
                                        className="flex-1 rounded-full mr-3 mb-2"
                                        onPress={() => handleDeletePost(report)}
                                    >
                                        게시글 삭제
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-full mb-2"
                                    onPress={() => handleDeleteReport(report.id)}
                                >
                                    신고 내역 삭제
                                </Button>
                            </StyledView>
                        </StyledView>
                    ))
                )}
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}

function translateReason(reason) {
    switch (reason) {
        case "spam":
            return "스팸/광고";
        case "abusive":
            return "욕설/혐오 표현";
        case "misinformation":
            return "허위 정보";
        case "policy":
        default:
            return "정책 위반";
    }
}
