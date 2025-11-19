import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Search, Bell, Edit3 } from 'lucide-react-native';
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

export default function Home() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('뉴스레터');

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

    const filteredNews = newsList.filter(news =>
        news.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPopular = communityPosts
        .filter(post => (post.like_count || post.liked_users?.length || 0) > 5)
        .filter(post => post.title?.toLowerCase().includes(searchQuery.toLowerCase()));

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

            <StyledScrollView className="flex-1">
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
                        <StockTicker />
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

            {/* Floating Action Button */}
            {activeTab === '인기글' && (
                <StyledTouchableOpacity
                    onPress={() => router.push('/write-post')}
                    className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 items-center justify-center shadow-lg z-50"
                >
                    <Edit3 size={24} color="white" />
                </StyledTouchableOpacity>
            )}
        </StyledSafeAreaView>
    );
}
