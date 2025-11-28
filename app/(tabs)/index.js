import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Button } from '../../components/ui/button';
import { Search, Bell } from 'lucide-react-native';
import NewsCard from '../../components/NewsCard';
import { Skeleton } from '../../components/ui/skeleton';
import { styled } from 'nativewind';
import MarketIndexGuideModal from '../../components/MarketIndexGuideModal';
import { useMarketIndices } from '../../hooks/useMarketIndices';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import { usePushNotificationsContext } from '../../context/PushNotificationsContext';
import { BlurView } from 'expo-blur';
import AIBriefingCard from '../../components/AIBriefingCard';
import MarketMarquee from '../../components/MarketMarquee';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

export default function Home() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const [showIndexModal, setShowIndexModal] = useState(false);
    const {
        indices: displayIndices,
        lastUpdatedAt: indexUpdatedAt,
        refetch: refetchMarketIndices,
        isFetching: isFetchingIndices,
    } = useMarketIndices();
    const keyboardVisible = useKeyboardVisible();
    const [selectedIndexId, setSelectedIndexId] = useState(displayIndices[0]?.id ?? 'nasdaq');
    const {
        permissionStatus,
        registerForPushNotifications,
        isSyncing: isRegisteringPush,
        isSupported: pushSupported,
    } = usePushNotificationsContext();
    const shouldShowPushIndicator = pushSupported && permissionStatus !== "granted";

    const handleNotificationPress = useCallback(() => {
        if (!pushSupported || permissionStatus === "unsupported") {
            Alert.alert("알림을 지원하지 않는 기기", "이 기기에서는 푸시 알림을 사용할 수 없습니다.");
            return;
        }

        if (permissionStatus === "granted") {
            Alert.alert("알림이 켜져 있어요", "마이 탭의 '알림 설정'에서 언제든지 조정할 수 있습니다.");
            return;
        }

        Alert.alert(
            "푸시 알림 받기",
            "마감 임박 공모전과 새 뉴스레터 알림을 받아볼까요?",
            [
                { text: "나중에", style: "cancel" },
                {
                    text: isRegisteringPush ? "처리 중..." : "알림 받기",
                    onPress: () => {
                        if (isRegisteringPush) return;
                        registerForPushNotifications().then((result) => {
                            if (!result?.ok && result?.reason === "denied") {
                                Alert.alert("알림 허용이 필요해요", "디바이스 설정에서 Fine News의 알림을 허용해주세요.");
                            }
                        });
                    },
                },
            ],
            { cancelable: true }
        );
    }, [isRegisteringPush, permissionStatus, pushSupported, registerForPushNotifications]);

    const [isAdmin, setIsAdmin] = useState(false);
    const { user } = usePushNotificationsContext(); // Assuming user is available here, or use auth

    useEffect(() => {
        const checkAdmin = async () => {
            if (auth.currentUser) {
                try {
                    const tokenResult = await auth.currentUser.getIdTokenResult();
                    setIsAdmin(!!tokenResult.claims.admin);
                } catch (e) {
                    console.log("Error checking admin status", e);
                }
            } else {
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, [auth.currentUser]); // Depend on auth.currentUser

    const { data: newsList, isLoading: newsLoading, refetch: refetchNews } = useQuery({
        queryKey: ['news', isAdmin], // Add isAdmin to queryKey to trigger refetch
        queryFn: async () => {
            try {
                let results = [];
                if (isAdmin) {
                    // Fetch separately to avoid composite index requirement
                    const pendingQ = query(
                        collection(db, 'news_drafts'),
                        where('state', '==', 'pending'),
                        orderBy('created_at', 'desc'),
                        limit(20)
                    );

                    const publishedQ = query(
                        collection(db, 'news_drafts'),
                        where('state', '==', 'published'),
                        orderBy('published_date', 'desc'),
                        limit(50)
                    );

                    const [pendingSnap, publishedSnap] = await Promise.all([
                        getDocs(pendingQ),
                        getDocs(publishedQ)
                    ]);

                    const pendingDocs = pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    const publishedDocs = publishedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // Merge and sort by created_at (or published_date for published ones if preferred)
                    // Here we simply put pending on top or mix them by date
                    results = [...pendingDocs, ...publishedDocs].sort((a, b) => {
                        const dateA = a.created_at?.seconds || 0;
                        const dateB = b.created_at?.seconds || 0;
                        return dateB - dateA;
                    });
                } else {
                    // Users only see published
                    const q = query(
                        collection(db, 'news_drafts'),
                        where('state', '==', 'published'),
                        orderBy('published_date', 'desc'),
                        limit(50)
                    );
                    const querySnapshot = await getDocs(q);
                    results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
                return results;
            } catch (e) {
                console.log("Error fetching news", e);
                return [];
            }
        },
        initialData: []
    });

    // Refetch when user logs in/out or admin status changes
    useEffect(() => {
        refetchNews();
    }, [isAdmin, refetchNews]);

    useEffect(() => {
        if (!selectedIndexId && displayIndices.length) {
            setSelectedIndexId(displayIndices[0].id);
        }
    }, [displayIndices, selectedIndexId]);

    const handleOpenIndexModal = (item) => {
        setSelectedIndexId(item?.id ?? displayIndices[0]?.id ?? 'nasdaq');
        setShowIndexModal(true);
    };

    const { data: dailyBriefing } = useQuery({
        queryKey: ['dailyBriefing'],
        queryFn: async () => {
            try {
                const q = query(collection(db, 'daily_briefings'), orderBy('created_at', 'desc'), limit(1));
                const snapshot = await getDocs(q);
                if (snapshot.empty) return null;
                const docSnapshot = snapshot.docs[0];
                return { id: docSnapshot.id, ...docSnapshot.data() };
            } catch (e) {
                console.log("Error fetching briefing", e);
                return null;
            }
        }
    });

    const bottomInset = useMemo(() => Math.max(insets.bottom, 16), [insets.bottom]);
    const shouldShowMarquee = displayIndices.length > 0 && !keyboardVisible;
    const safeTabBarHeight = Number.isFinite(tabBarHeight) ? tabBarHeight : 0;
    const tabBarVisibleHeight = Math.max(safeTabBarHeight - bottomInset, 0);
    const baseBottomOffset = tabBarVisibleHeight + bottomInset;
    const scrollPaddingBottom = baseBottomOffset + 32;
    const briefingContent = typeof dailyBriefing === "string" ? dailyBriefing : dailyBriefing?.content;
    const briefingDate = dailyBriefing?.created_at?.seconds
        ? new Date(dailyBriefing.created_at.seconds * 1000)
        : new Date();

    return (
        <StyledSafeAreaView edges={['top']} className="flex-1 bg-white">

            {/* Header */}
            <StyledView className="bg-white/95 z-10 border-b border-gray-100 px-4 py-3 backdrop-blur">
                <StyledView className="flex-row items-center justify-between mb-3">
                    <StyledText className="text-xl font-bold text-gray-900">홈</StyledText>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onPress={handleNotificationPress}
                        disabled={isRegisteringPush && permissionStatus !== "granted"}
                    >
                        <StyledView className="relative">
                            <Bell size={20} color="#000" />
                            {shouldShowPushIndicator && (
                                <StyledView className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
                            )}
                        </StyledView>
                    </Button>
                </StyledView>
                <View
                    style={{
                        borderRadius: 999,
                        marginBottom: 12,
                        shadowColor: "#0f172a",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.08,
                        shadowRadius: 18,
                        elevation: 8,
                    }}
                >
                    <BlurView intensity={45} tint="light" style={{ borderRadius: 999, overflow: 'hidden' }}>
                        <StyledTouchableOpacity
                            onPress={() => router.push('/search')}
                            className="flex-row items-center h-11 px-4"
                            activeOpacity={0.8}
                        >
                            <Search size={16} color="#7c3aed" />
                            <StyledText className="ml-2 text-sm text-gray-500">
                                뉴스 · 커뮤니티 · 공모전 검색
                            </StyledText>
                        </StyledTouchableOpacity>
                    </BlurView>
                </View>
            </StyledView>

            <StyledScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}>
                {briefingContent && (
                    <AIBriefingCard content={briefingContent} createdAt={briefingDate} />
                )}

                {shouldShowMarquee && (
                    <MarketMarquee
                        indices={displayIndices}
                        onChipPress={handleOpenIndexModal}
                        onRefresh={refetchMarketIndices}
                        isRefreshing={isFetchingIndices}
                        lastUpdatedAt={indexUpdatedAt}
                    />
                )}

                <StyledView className="px-4 py-6">
                    <StyledText className="text-xl font-bold text-gray-900 mb-4">최신 경제 인사이트</StyledText>
                    <StyledView className="space-y-2">
                        {newsLoading ? (
                            Array(4).fill(0).map((_, i) => (
                                <StyledView key={i} className="mb-4 space-y-2">
                                    <Skeleton className="h-32 w-full rounded-xl" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </StyledView>
                            ))
                        ) : newsList.length > 0 ? (
                            newsList.slice(0, 10).map((news) => (
                                <StyledView key={news.id} className="w-full">
                                    <NewsCard news={news} />
                                </StyledView>
                            ))
                        ) : (
                            <StyledView className="py-12 items-center justify-center">
                                <StyledText className="text-4xl mb-2">😴</StyledText>
                                <StyledText className="text-base font-semibold text-gray-900 mb-1">
                                    모든 소식을 따라잡았어요
                                </StyledText>
                                <StyledText className="text-sm text-gray-500 mb-1 text-center">
                                    새로운 이슈가 생기면 바로 알려드릴게요.
                                </StyledText>
                                <StyledText className="text-xs text-gray-400 mb-4 text-center">
                                    No news is good news... 잠시 숨을 고르세요.
                                </StyledText>
                                <Button variant="outline" onPress={refetchNews}>
                                    새로고침
                                </Button>
                            </StyledView>
                        )}
                    </StyledView>
                </StyledView>
            </StyledScrollView>

            <MarketIndexGuideModal
                visible={showIndexModal}
                onClose={() => setShowIndexModal(false)}
                selectedIndexId={selectedIndexId}
                indices={displayIndices}
            />
        </StyledSafeAreaView>
    );
}
