import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Search, Bell, Edit3, X } from 'lucide-react-native';
import NewsCard from '../../components/NewsCard';
import StockTicker from '../../components/StockTicker';
import CommunityPostCard from '../../components/CommunityPostCard';
import { Skeleton } from '../../components/ui/skeleton';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

const INDEX_ITEMS = [
    {
        id: 'nasdaq',
        label: '나스닥',
        value: '22,870.35',
        change: '-2.2%',
        description: '미국 기술주 중심 지수. 금리/성장주 모멘텀에 크게 반응합니다.',
        note: '데이터 출처: 미국증시 종가 기준. 실시간 값은 향후 API 연동 예정입니다.',
    },
    {
        id: 'dow',
        label: '뉴욕 시장',
        value: '38,045.23',
        change: '+0.6%',
        description: '다우존스 산업평균 지수. 전통 제조·금융 업종 비중이 높습니다.',
    },
    {
        id: 'kospi',
        label: '코스피',
        value: '2,741.18',
        change: '-0.3%',
        description: '국내 대형주 지수. 외국인 수급과 환율 영향이 큽니다.',
    },
    {
        id: 'kosdaq',
        label: '코스닥',
        value: '875.42',
        change: '+1.1%',
        description: '국내 벤처·중소형 성장주 지수. 변동성이 높습니다.',
    },
    {
        id: 'usdkrw',
        label: 'USD/KRW',
        value: '1,361.20',
        change: '-0.5%',
        description: '원·달러 환율. 수출주 실적과 외국인 매수에 직접 영향.',
    },
    {
        id: 'bitcoin',
        label: '비트코인',
        value: '$62,430',
        change: '+3.4%',
        description: '대표 가상자산. 글로벌 위험자산 선호지표로 활용됩니다.',
    },
];

export default function Home() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('뉴스레터');
    const [showIndexModal, setShowIndexModal] = useState(false);
    const [selectedIndexInfo, setSelectedIndexInfo] = useState(INDEX_ITEMS[0]);

    const { data: newsList, isLoading: newsLoading } = useQuery({
        queryKey: ['news'],
        queryFn: async () => {
            try {
                const q = query(collection(db, 'news'), orderBy('published_date', 'desc'), limit(50));
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.log("Error fetching news", e);
                return [];
            }
        },
        initialData: []
    });

    const { data: communityPosts, isLoading: communityLoading } = useQuery({
        queryKey: ['home-community-posts'],
        queryFn: async () => {
            try {
                const q = query(collection(db, 'community_posts'), orderBy('like_count', 'desc'), limit(20));
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.log("Error fetching posts", e);
                return [];
            }
        },
        initialData: []
    });

    const { data: marketDoc } = useQuery({
        queryKey: ['market-indices'],
        queryFn: async () => {
            try {
                const snap = await getDoc(doc(db, 'system', 'market_indices'));
                return snap.exists() ? snap.data() : null;
            } catch (error) {
                console.log('Error fetching market indices', error);
                return null;
            }
        },
        staleTime: 1000 * 60 * 10,
    });

    const filteredNews = newsList.filter(news =>
        news.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPopular = communityPosts
        .filter(post => (post.like_count || post.liked_users?.length || 0) > 5)
        .filter(post => post.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    const formatValue = (value, id) => {
        if (value === undefined || value === null) return undefined;
        const isCrypto = id === 'bitcoin';
        const decimals = id === 'usdkrw' ? 2 : isCrypto ? 0 : 2;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
    };

    const formatChange = (percent) => {
        if (percent === undefined || percent === null) return undefined;
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    const displayIndices = useMemo(() => {
        const items = marketDoc?.items;
        if (!items) return INDEX_ITEMS;
        return INDEX_ITEMS.map((item) => {
            const live = items[item.id];
            if (!live) return item;
            return {
                ...item,
                value: formatValue(live.value, item.id) ?? item.value,
                change: formatChange(live.changePercent ?? live.change_percent) ?? item.change,
            };
        });
    }, [marketDoc]);

    const handleOpenIndexModal = (item) => {
        setSelectedIndexInfo(item);
        setShowIndexModal(true);
    };

    const indexBarBottom = useMemo(() => Math.max(insets.bottom, 16), [insets.bottom]);

    return (
        <StyledSafeAreaView edges={['top']} className="flex-1 bg-white">

            {/* Header */}
            <StyledView className="bg-white z-10 border-b border-gray-100 px-4 py-3">
                <StyledView className="flex-row items-center justify-between mb-3">
                    <StyledText className="text-xl font-bold text-gray-900">홈</StyledText>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Bell size={20} color="#000" />
                    </Button>
                </StyledView>
                <StyledView className="relative mb-3 justify-center">
                    <StyledView className="absolute left-3 z-10">
                        <Search size={16} color="#9ca3af" />
                    </StyledView>
                    <Input
                        placeholder="검색"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="pl-10 bg-gray-50 border-0 rounded-full h-10"
                    />
                </StyledView>

                {/* Tabs */}
                <StyledView className="flex-row border-b border-gray-200">
                    {['뉴스레터', '인기글'].map((tab) => (
                        <StyledTouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`flex-1 py-2 items-center border-b-2 ${activeTab === tab ? 'border-indigo-600' : 'border-transparent'}`}
                        >
                            <StyledText className={`text-sm font-medium ${activeTab === tab ? 'text-indigo-600' : 'text-gray-500'}`}>
                                {tab}
                            </StyledText>
                        </StyledTouchableOpacity>
                    ))}
                </StyledView>
            </StyledView>

            <StyledScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
                {activeTab === '뉴스레터' ? (
                    <>
                        {/* Today's News Summary */}
                        <StyledView className="px-4 py-6 bg-indigo-50 border-b border-gray-100">
                            <StyledText className="text-lg font-bold text-gray-900 mb-2">오늘의 뉴스 요약</StyledText>
                            <StyledText className="text-sm text-gray-700 leading-6">
                                오늘 시장에서는 올림픽 같은 대형 이벤트의 성장 효과부터 빅테크의 유럽 독점 우려까지
                                관심이 높아지고 있어요! 뉴욕증시 하락에도 커지고 있고요!
                            </StyledText>
                            <StyledText className="text-xs text-indigo-600 mt-3 font-semibold">
                                아래로 기술주 중심 변동성도 커지고 있고고!
                            </StyledText>
                        </StyledView>

                        {/* Related News */}
                        <StyledView className="px-4 py-4">
                            <StyledText className="text-base font-bold text-gray-900 mb-4">관련 뉴스</StyledText>
                            <StyledView className="flex-row flex-wrap justify-between">
                                {newsLoading ? (
                                    Array(4).fill(0).map((_, i) => (
                                        <StyledView key={i} className="w-[48%] mb-4 space-y-2">
                                            <Skeleton className="aspect-video w-full rounded-lg" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-3 w-20" />
                                        </StyledView>
                                    ))
                                ) : (
                                    filteredNews.slice(0, 4).map((news) => (
                                        <StyledView key={news.id} className="w-[48%]">
                                            <NewsCard news={news} />
                                        </StyledView>
                                    ))
                                )}
                            </StyledView>
                        </StyledView>

                        {/* Stock Ticker */}
                    </>
                ) : (
                    <>
                        {/* Community Posts */}
                        <StyledView className="px-4 py-4 pb-20">
                            <StyledText className="text-base font-bold text-gray-900 mb-4">인기 커뮤니티 게시글</StyledText>
                            {communityLoading ? (
                                <StyledView className="space-y-2">
                                    {Array(5).fill(0).map((_, i) => (
                                        <StyledView key={i} className="p-4 border border-gray-200 rounded-lg mb-2">
                                            <Skeleton className="h-4 w-40 mb-2" />
                                            <Skeleton className="h-5 w-full mb-2" />
                                            <Skeleton className="h-3 w-32" />
                                        </StyledView>
                                    ))}
                                </StyledView>
                            ) : (
                                <StyledView>
                                    {filteredPopular.map((post) => (
                                        <CommunityPostCard key={post.id} post={post} />
                                    ))}
                                </StyledView>
                            )}
                        </StyledView>
                    </>
                )}
            </StyledScrollView>

            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
                <StockTicker indices={displayIndices} onPressIndex={handleOpenIndexModal} />
                <View style={{ height: indexBarBottom }} />
            </View>

            {/* Floating Action Button */}
            {activeTab === '인기글' && (
                <StyledTouchableOpacity
                    onPress={() => router.push('/write-post')}
                    className="absolute right-6 w-14 h-14 rounded-full bg-indigo-600 items-center justify-center shadow-lg z-50"
                    style={{ bottom: indexBarBottom + 72 }}
                >
                    <Edit3 size={24} color="white" />
                </StyledTouchableOpacity>
            )}

            <Modal
                visible={showIndexModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowIndexModal(false)}
            >
                <Pressable className="flex-1 bg-black/40" onPress={() => setShowIndexModal(false)} />
                <StyledView className="bg-white rounded-t-3xl px-5 pt-5 pb-8" style={{ gap: 12 }}>
                    <StyledView className="flex-row items-center justify-between mb-2">
                        <StyledText className="text-lg font-bold text-gray-900">지수 안내</StyledText>
                        <TouchableOpacity onPress={() => setShowIndexModal(false)}>
                            <X size={20} color="#1f2937" />
                        </TouchableOpacity>
                    </StyledView>
                    <StyledView className="border border-gray-100 rounded-2xl px-4 py-4 bg-gray-50">
                        <StyledText className="text-sm text-gray-500 mb-1">{selectedIndexInfo.label}</StyledText>
                        <StyledText className="text-2xl font-bold text-gray-900 mb-1">{selectedIndexInfo.value}</StyledText>
                        {selectedIndexInfo.change && (
                            <StyledText
                                className="text-sm font-semibold"
                                style={{ color: selectedIndexInfo.change.startsWith('+') ? '#16a34a' : '#dc2626' }}
                            >
                                {selectedIndexInfo.change}
                            </StyledText>
                        )}
                    </StyledView>
                    <StyledText className="text-sm text-gray-700 leading-6">
                        {selectedIndexInfo.description}
                    </StyledText>
                    {selectedIndexInfo.note && (
                        <StyledText className="text-xs text-gray-500 bg-indigo-50 rounded-2xl px-3 py-2">
                            {selectedIndexInfo.note}
                        </StyledText>
                    )}
                    <StyledText className="text-xs text-gray-400">
                        * 실시간 지수 연동은 API 확정 후 적용 예정입니다.
                    </StyledText>
                </StyledView>
            </Modal>
        </StyledSafeAreaView>
    );
}
