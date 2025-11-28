import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment,
    Timestamp,
    deleteDoc,
    addDoc,
    collection,
    serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { ArrowLeft, Heart, MoreVertical, Send } from "lucide-react-native";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { BlurView } from "expo-blur";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function CommunityDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const user = auth.currentUser;
    const userId = user?.uid;
    const queryClient = useQueryClient();
    const [comment, setComment] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [isPostEditing, setIsPostEditing] = useState(false);
    const boardTypes = ["자유", "취업", "모집", "스터디"];
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editBoardType, setEditBoardType] = useState(boardTypes[0]);
    const [reportTarget, setReportTarget] = useState(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
    const REPORT_REASONS = [
        { label: "스팸/광고", value: "spam" },
        { label: "욕설/혐오 표현", value: "abusive" },
        { label: "허위 정보", value: "misinformation" },
        { label: "기타 정책 위반", value: "policy" },
    ];

    const { data: post, isLoading } = useQuery({
        queryKey: ["community-post", id],
        queryFn: async () => {
            if (!id) return null;
            const ref = doc(db, "community_posts", id);
            const snap = await getDoc(ref);
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        },
        enabled: !!id,
    });

    const likedUsers = post?.liked_users || [];
    const likeCount = post?.like_count ?? likedUsers.length ?? 0;
    const hasLiked = userId ? likedUsers.includes(userId) : false;
    const postAuthorIdentifier = post?.created_by || post?.user_id || "demo@example.com";
    const currentIdentifier = user?.email || userId || "demo-user";
    const isAuthor = currentIdentifier === (post?.created_by || "demo@example.com");

    const createdDate = post?.created_date
        ? new Date(post.created_date.seconds ? post.created_date.seconds * 1000 : post.created_date)
        : null;
    const postImageAspectRatio =
        post?.image_meta?.width && post?.image_meta?.height
            ? post.image_meta.width / post.image_meta.height
            : 4 / 3;
    const authorDisplayName =
        post?.author_display ||
        post?.author_name ||
        post?.nickname ||
        (post?.created_by ? post.created_by.split("@")[0] : "익명");
    const authorInitial = authorDisplayName?.[0]?.toUpperCase() || "U";

    const handleLike = async () => {
        if (!post?.id) return;
        if (!userId) {
            Alert.alert("로그인 필요", "좋아요를 누르려면 먼저 로그인해주세요.", [
                { text: "취소", style: "cancel" },
                { text: "로그인", onPress: () => router.push("/login") },
            ]);
            return;
        }
        try {
            const ref = doc(db, "community_posts", post.id);
            if (hasLiked) {
                await updateDoc(ref, {
                    liked_users: arrayRemove(userId),
                    like_count: increment(-1),
                });
            } else {
                await updateDoc(ref, {
                    liked_users: arrayUnion(userId),
                    like_count: increment(1),
                });
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["community-post", post.id] }),
                queryClient.invalidateQueries({ queryKey: ["tab-community-posts"] }),
            ]);
        } catch (error) {
            console.log("Failed to toggle like", error);
        }
    };

    const handleDeletePost = () => {
        Alert.alert("게시글 삭제", "정말로 게시글을 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    if (!post?.id) return;
                    try {
                        await deleteDoc(doc(db, "community_posts", post.id));
                        await Promise.all([
                            queryClient.invalidateQueries({ queryKey: ["tab-community-posts"] }),
                        ]);
                        router.back();
                    } catch (error) {
                        console.log("Failed to delete post", error);
                        Alert.alert("오류", "게시글을 삭제하지 못했습니다.");
                    }
                },
            },
        ]);
    };

    const handleAddComment = async () => {
        if (!userId) {
            Alert.alert("로그인 필요", "댓글을 작성하려면 로그인해주세요.", [
                { text: "취소", style: "cancel" },
                { text: "로그인", onPress: () => router.push("/login") },
            ]);
            return;
        }
        if (!comment.trim()) {
            Alert.alert("댓글 작성", "댓글 내용을 입력해주세요.");
            return;
        }
        if (!post?.id || isCommenting) return;
        setIsCommenting(true);
        const isCommentAuthor = currentIdentifier === (post?.created_by || "demo@example.com");

        let anonIndex = null;
        if (!isCommentAuthor) {
            const existingEntry = (comments || []).find(
                (c) => !c.is_author && c.user_id === userId && typeof c.anon_index === "number"
            );
            if (existingEntry) {
                anonIndex = existingEntry.anon_index;
            } else {
                const used = (comments || [])
                    .filter((c) => !c.is_author && typeof c.anon_index === "number")
                    .map((c) => c.anon_index);
                anonIndex = used.length ? Math.max(...used) + 1 : 1;
            }
        }

        const displayName = isCommentAuthor ? "익명(작성자)" : `익명${anonIndex}`;

        const newComment = {
            id: `c-${Date.now()}`,
            author: displayName,
            display_name: displayName,
            is_author: isCommentAuthor,
            anon_index: isCommentAuthor ? null : anonIndex,
            content: comment.trim(),
            created_at: Timestamp.fromDate(new Date()),
            user_id: userId,
        };
        try {
            const ref = doc(db, "community_posts", post.id);
            await updateDoc(ref, {
                comments: arrayUnion(newComment),
                comment_count: increment(1),
            });
            setComment("");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["community-post", post.id] }),
                queryClient.invalidateQueries({ queryKey: ["tab-community-posts"] }),
            ]);
        } catch (error) {
            console.log("Failed to add comment", error);
            Alert.alert("오류", "댓글을 저장하지 못했습니다.");
        } finally {
            setIsCommenting(false);
        }
    };

    const comments = post?.comments || [];

    const enforceLogin = () => {
        Alert.alert("로그인 필요", "이 기능을 사용하려면 로그인해주세요.", [
            { text: "취소", style: "cancel" },
            { text: "로그인", onPress: () => router.push("/login") },
        ]);
    };

    const openReportSheet = (targetConfig) => {
        if (!userId) {
            enforceLogin();
            return;
        }
        setReportTarget(targetConfig);
    };

    const closeReportSheet = () => {
        if (isSubmittingReport) return;
        setReportTarget(null);
    };

    const startPostEdit = () => {
        if (!post) return;
        setEditTitle(post.title || "");
        setEditContent(post.content || "");
        setEditBoardType(post.board_type || boardTypes[0]);
        setIsPostEditing(true);
        setIsActionSheetVisible(false);
    };

    const cancelPostEdit = () => {
        setIsPostEditing(false);
    };

    const savePostEdit = async () => {
        if (!post?.id || !editTitle.trim() || !editContent.trim()) {
            Alert.alert("게시글 수정", "제목과 내용을 입력해주세요.");
            return;
        }
        try {
            await updateDoc(doc(db, "community_posts", post.id), {
                title: editTitle.trim(),
                content: editContent.trim(),
                board_type: editBoardType,
                updated_at: Timestamp.fromDate(new Date()),
            });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["community-post", post.id] }),
                queryClient.invalidateQueries({ queryKey: ["tab-community-posts"] }),
            ]);
            setIsPostEditing(false);
        } catch (error) {
            console.log("Failed to edit post", error);
            Alert.alert("오류", "게시글을 수정하지 못했습니다.");
        }
    };

    const submitReport = async (reason) => {
        if (!reportTarget || !post?.id || !reason || isSubmittingReport) return;
        setIsSubmittingReport(true);
        try {
            await addDoc(collection(db, "community_reports"), {
                type: reportTarget.type,
                post_id: post.id,
                comment_id: reportTarget.type === "comment" ? reportTarget.comment?.id : null,
                reason,
                reporter_id: userId,
                reporter_identifier: currentIdentifier,
                reported_user_id:
                    reportTarget.type === "comment"
                        ? reportTarget.comment?.user_id || null
                        : post.user_id || post.created_by || null,
                snapshot: {
                    post: {
                        title: post.title,
                        content: post.content,
                        board_type: post.board_type,
                    },
                    comment: reportTarget.type === "comment" ? reportTarget.comment : null,
                },
                status: "pending",
                created_at: serverTimestamp(),
            });
            Alert.alert("신고 완료", "운영팀이 검토 후 조치할 예정입니다.");
        } catch (error) {
            console.log("Failed to submit report", error);
            Alert.alert("오류", "신고를 접수하지 못했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsSubmittingReport(false);
            setReportTarget(null);
        }
    };

    const handleOpenActions = () => {
        if (isAuthor) {
            setIsActionSheetVisible(true);
        } else {
            openReportSheet({ type: "post" });
        }
    };

    if (isLoading) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white items-center justify-center">
                <StyledText className="text-sm text-gray-500">게시글을 불러오는 중입니다...</StyledText>
            </StyledSafeAreaView>
        );
    }

    if (!post) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white items-center justify-center">
                <StyledText className="text-sm text-gray-500">게시글을 찾을 수 없습니다.</StyledText>
                <Button className="mt-4" onPress={() => router.back()}>
                    돌아가기
                </Button>
            </StyledSafeAreaView>
        );
    }

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="text-sm font-semibold text-gray-800">{post.board_type || "커뮤니티"}</StyledText>
                <Button variant="ghost" size="icon" className="rounded-full" onPress={handleOpenActions}>
                    <MoreVertical size={22} color="#111827" />
                </Button>
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 200 }}>
                {isPostEditing ? (
                    <>
                        <TextInput
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="제목"
                            className="border border-gray-200 rounded-lg px-3 py-2 text-base mb-2"
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                            {boardTypes.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setEditBoardType(type)}
                                    className={`px-3 py-1.5 rounded-full mr-2 border ${editBoardType === type ? "bg-indigo-600 border-indigo-600" : "border-gray-200"
                                        }`}
                                >
                                    <Text className={editBoardType === type ? "text-white text-sm" : "text-gray-700 text-sm"}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TextInput
                            value={editContent}
                            onChangeText={setEditContent}
                            placeholder="내용"
                            multiline
                            textAlignVertical="top"
                            className="border border-gray-200 rounded-lg px-3 py-2 min-h-[200px] text-base mb-4"
                        />
                        <StyledView className="flex-row space-x-3">
                            <Button className="flex-1 rounded-full" onPress={savePostEdit}>
                                저장
                            </Button>
                            <Button className="flex-1 rounded-full" variant="outline" onPress={cancelPostEdit}>
                                취소
                            </Button>
                        </StyledView>
                    </>
                ) : (
                    <>
                        <StyledView className="flex-row items-center mb-4">
                            <StyledView className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center">
                                <StyledText className="text-indigo-600 text-lg font-bold">{authorInitial}</StyledText>
                            </StyledView>
                            <StyledView className="ml-3 flex-1">
                                <StyledText className="text-base font-semibold text-gray-900">{authorDisplayName}</StyledText>
                                <StyledText className="text-xs text-gray-500 mt-0.5">
                                    {post.university || "캠퍼스 미정"} ·{" "}
                                    {createdDate ? format(createdDate, "yy.MM.dd HH:mm", { locale: ko }) : "시간 미정"}
                                </StyledText>
                            </StyledView>
                        </StyledView>
                        <StyledText className="text-2xl font-black text-gray-900 mb-2">{post.title}</StyledText>
                        <StyledText className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">
                            #{post.board_type || "게시판"}
                        </StyledText>

                        {/* Image Gallery */}
                        {post.images && post.images.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                {post.images.map((img, index) => (
                                    <StyledImage
                                        key={index}
                                        source={{ uri: img.url }}
                                        className="w-80 h-60 rounded-2xl bg-gray-100 mr-3"
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                        ) : post.image_url ? (
                            <StyledImage
                                source={{ uri: post.image_url }}
                                className="w-full rounded-2xl mb-6 bg-gray-100"
                                resizeMode="cover"
                                style={{ aspectRatio: postImageAspectRatio }}
                            />
                        ) : null}

                        <StyledView className="mb-6">
                            {post.content?.split("\n").map((line, idx) => (
                                <StyledText key={idx} className="text-base text-gray-800 mb-3 leading-7">
                                    {line}
                                </StyledText>
                            ))}
                        </StyledView>
                    </>
                )}

                <StyledView className="flex-row items-center justify-between mb-6">
                    <TouchableOpacity
                        onPress={handleLike}
                        className={`flex-row items-center space-x-2 px-4 py-2 rounded-full border ${hasLiked ? "border-rose-200 bg-rose-50" : "border-gray-200"}`}
                    >
                        <Heart size={18} color={hasLiked ? "#ef4444" : "#4b5563"} fill={hasLiked ? "#ef4444" : "transparent"} />
                        <StyledText className="text-sm text-gray-900">{likeCount}</StyledText>
                    </TouchableOpacity>
                    <StyledText className="text-xs text-indigo-500">
                        {post.comment_count ?? post.comments?.length ?? 0}개의 대화
                    </StyledText>
                </StyledView>

                {!isPostEditing && (
                    <StyledView className="mb-4">
                        <StyledText className="text-base font-bold text-gray-900 mb-3">
                            댓글 {post.comment_count ?? post.comments?.length ?? 0}
                        </StyledText>
                        {comments.length ? (
                            comments.map((item) => {
                                const date = item.created_at
                                    ? new Date(item.created_at.seconds ? item.created_at.seconds * 1000 : item.created_at)
                                    : null;
                                const isOwner = item.user_id === userId;
                                const isEditing = editingCommentId === item.id;

                                const startEdit = () => {
                                    setEditingCommentId(item.id);
                                    setEditingText(item.content);
                                };

                                const cancelEdit = () => {
                                    setEditingCommentId(null);
                                    setEditingText("");
                                };

                                const saveEdit = async () => {
                                    if (!editingText.trim()) {
                                        Alert.alert("댓글 수정", "내용을 입력해주세요.");
                                        return;
                                    }
                                    try {
                                        const updated = comments.map((c) =>
                                            c.id === item.id ? { ...c, content: editingText.trim(), edited_at: Timestamp.fromDate(new Date()) } : c
                                        );
                                        await updateDoc(doc(db, "community_posts", post.id), { comments: updated });
                                        await queryClient.invalidateQueries({ queryKey: ["community-post", post.id] });
                                        cancelEdit();
                                    } catch (error) {
                                        console.log("Failed to edit comment", error);
                                        Alert.alert("오류", "댓글을 수정하지 못했습니다.");
                                    }
                                };

                                const deleteComment = async () => {
                                    Alert.alert("댓글 삭제", "댓글을 삭제할까요?", [
                                        { text: "취소", style: "cancel" },
                                        {
                                            text: "삭제",
                                            style: "destructive",
                                            onPress: async () => {
                                                try {
                                                    const updated = comments.filter((c) => c.id !== item.id);
                                                    await updateDoc(doc(db, "community_posts", post.id), {
                                                        comments: updated,
                                                        comment_count: increment(-1),
                                                    });
                                                    await Promise.all([
                                                        queryClient.invalidateQueries({ queryKey: ["community-post", post.id] }),
                                                        queryClient.invalidateQueries({ queryKey: ["tab-community-posts"] }),
                                                    ]);
                                                } catch (error) {
                                                    console.log("Failed to delete comment", error);
                                                    Alert.alert("오류", "댓글을 삭제하지 못했습니다.");
                                                }
                                            },
                                        },
                                    ]);
                                };

                                return (
                                    <StyledView key={item.id} className="mb-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
                                        <StyledView className="flex-row justify-between items-center mb-1">
                                            <StyledText className="text-sm font-semibold text-gray-900">
                                                {item.display_name ||
                                                    (item.is_author ? "익명(작성자)" : item.author || "익명")}
                                            </StyledText>
                                            {isOwner ? (
                                                <StyledView className="flex-row space-x-2">
                                                    {isEditing ? (
                                                        <>
                                                            <TouchableOpacity onPress={saveEdit}>
                                                                <StyledText className="text-xs text-indigo-600">저장</StyledText>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={cancelEdit}>
                                                                <StyledText className="text-xs text-gray-500">취소</StyledText>
                                                            </TouchableOpacity>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TouchableOpacity onPress={startEdit}>
                                                                <StyledText className="text-xs text-indigo-600">수정</StyledText>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={deleteComment}>
                                                                <StyledText className="text-xs text-red-500">삭제</StyledText>
                                                            </TouchableOpacity>
                                                        </>
                                                    )}
                                                </StyledView>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => openReportSheet({ type: "comment", comment: item })}
                                                >
                                                    <StyledText className="text-xs text-red-500">신고</StyledText>
                                                </TouchableOpacity>
                                            )}
                                        </StyledView>
                                        <StyledText className="text-xs text-gray-500 mb-1">
                                            {date ? format(date, "yy.MM.dd HH:mm", { locale: ko }) : ""}
                                        </StyledText>
                                        {isEditing ? (
                                            <TextInput
                                                value={editingText}
                                                onChangeText={setEditingText}
                                                multiline
                                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
                                            />
                                        ) : (
                                            <StyledText className="text-sm text-gray-700">{item.content}</StyledText>
                                        )}
                                    </StyledView>
                                );
                            })
                        ) : (
                            <StyledText className="text-sm text-gray-500">아직 댓글이 없습니다.</StyledText>
                        )}
                    </StyledView>
                )}
            </StyledScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <BlurView intensity={85} tint="light" className="border-t border-gray-200/60">
                    <StyledView className="flex-row items-end p-3 space-x-3">
                        <StyledView className="flex-1 bg-gray-50/90 rounded-3xl px-4 py-2.5 border border-gray-200 flex-row">
                            <TextInput
                                placeholder={userId ? "댓글을 남겨보세요" : "로그인 후 댓글을 작성할 수 있어요"}
                                placeholderTextColor="#9ca3af"
                                multiline
                                editable={!!userId && !isCommenting}
                                value={comment}
                                onChangeText={setComment}
                                className="flex-1 text-base text-gray-900"
                                style={{ paddingTop: 0, paddingBottom: 0, minHeight: 24 }}
                            />
                        </StyledView>
                        <TouchableOpacity
                            onPress={handleAddComment}
                            disabled={!userId || !comment.trim() || isCommenting}
                            className={`w-12 h-12 rounded-full items-center justify-center ${
                                userId && comment.trim() && !isCommenting ? "bg-indigo-600 shadow-lg shadow-indigo-400/50" : "bg-gray-200"
                            }`}
                        >
                            <Send
                                size={20}
                                color={userId && comment.trim() && !isCommenting ? "#ffffff" : "#9ca3af"}
                                strokeWidth={2.3}
                            />
                        </TouchableOpacity>
                    </StyledView>
                </BlurView>
            </KeyboardAvoidingView>
            <Modal transparent visible={isActionSheetVisible} animationType="fade" onRequestClose={() => setIsActionSheetVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setIsActionSheetVisible(false)} />
                    <StyledView className="bg-white rounded-t-3xl px-5 pt-5 pb-6">
                        <StyledText className="text-base font-semibold text-gray-900 mb-4">게시글 옵션</StyledText>
                        {isAuthor ? (
                            <>
                                <TouchableOpacity
                                    className="py-3 border-b border-gray-100"
                                    onPress={startPostEdit}
                                >
                                    <StyledText className="text-sm text-gray-900">게시글 수정</StyledText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="py-3 border-b border-gray-100"
                                    onPress={() => {
                                        setIsActionSheetVisible(false);
                                        handleDeletePost();
                                    }}
                                >
                                    <StyledText className="text-sm text-red-500">게시글 삭제</StyledText>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                className="py-3 border-b border-gray-100"
                                onPress={() => {
                                    setIsActionSheetVisible(false);
                                    openReportSheet({ type: "post" });
                                }}
                            >
                                <StyledText className="text-sm text-red-500">게시글 신고</StyledText>
                            </TouchableOpacity>
                        )}
                        <Button variant="ghost" className="mt-4 rounded-full" onPress={() => setIsActionSheetVisible(false)}>
                            닫기
                        </Button>
                    </StyledView>
                </View>
            </Modal>
            <Modal transparent visible={!!reportTarget} animationType="fade" onRequestClose={closeReportSheet}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeReportSheet} />
                    <StyledView className="bg-white rounded-t-3xl px-5 pt-5 pb-6">
                        <StyledText className="text-base font-semibold text-gray-900 mb-1">신고 사유 선택</StyledText>
                        <StyledText className="text-xs text-gray-500 mb-4">
                            운영팀이 빠르게 검토할 수 있도록 가장 가까운 사유를 선택해주세요.
                        </StyledText>
                        {REPORT_REASONS.map((reason) => (
                            <TouchableOpacity
                                key={reason.value}
                                className={`py-3 border-b border-gray-100 ${isSubmittingReport ? "opacity-50" : ""}`}
                                disabled={isSubmittingReport}
                                onPress={() => submitReport(reason.value)}
                            >
                                <StyledText className="text-sm text-gray-900">{reason.label}</StyledText>
                            </TouchableOpacity>
                        ))}
                        <Button
                            variant="ghost"
                            className="mt-4 rounded-full"
                            onPress={closeReportSheet}
                            disabled={isSubmittingReport}
                        >
                            취소
                        </Button>
                    </StyledView>
                </View>
            </Modal>
        </StyledSafeAreaView>
    );
}
