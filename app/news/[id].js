import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Share, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ArrowLeft, Share2, CheckCircle } from 'lucide-react-native';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '../../components/ui/skeleton';
import NewsCard from '../../components/NewsCard';
import RenderHtml from 'react-native-render-html';
import { styled } from 'nativewind';
import { auth } from '../../firebaseConfig';
import { Edit } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') {
        return value.toDate();
    }
    if (value.seconds) {
        return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function NewsDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [showRelated, setShowRelated] = useState(false);
    const { width } = useWindowDimensions();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            if (auth.currentUser) {
                const tokenResult = await auth.currentUser.getIdTokenResult();
                setIsAdmin(!!tokenResult.claims.admin);
            }
        };
        checkAdmin();
    }, []);

    const { data: news, isLoading } = useQuery({
        queryKey: ['news', id],
        queryFn: async () => {
            if (!id) return null;
            const docRef = doc(db, 'news_drafts', id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        },
        enabled: !!id
    });

    const { data: relatedNews, isLoading: relatedLoading } = useQuery({
        queryKey: ['related-news', news?.tags],
        queryFn: async () => {
            try {
                // Simple query for now, ideally filter by tags
                const q = query(collection(db, 'news_drafts'), where('state', '==', 'published'), orderBy('published_date', 'desc'), limit(6));
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(n => n.id !== id);
            } catch (e) {
                return [];
            }
        },
        enabled: !!news
    });

    const displayDate = useMemo(
        () => {
            if (!news) return null;
            return toDate(news?.published_date) || toDate(news?.created_date);
        },
        [news?.created_date, news?.published_date]
    );

    const handleShare = useCallback(async () => {
        if (!news) return;
        const shareUrl =
            news.share_url ||
            news.url ||
            news.sourceUrl ||
            news.source_url ||
            news.link ||
            (typeof id === 'string' ? `https://fine-news.app/news/${id}` : '');
        const shareMessageParts = [
            news.title,
            news.summary || news.subtitle,
            shareUrl
        ].filter(Boolean);
        const sharePayload = shareMessageParts.join('\n\n');

        try {
            await Share.share({
                title: news.title || 'FINE 뉴스 공유',
                message: sharePayload.length ? sharePayload : news.title || 'FINE에서 공유하기',
                url: shareUrl || undefined
            });
        } catch (error) {
            if (error?.message !== 'User did not share') {
                console.log('Share error', error);
                Alert.alert('공유 실패', '다시 시도하거나 네트워크 연결을 확인해 주세요.');
            }
        }
    }, [id, news]);

    if (isLoading) {
        return (
            <StyledSafeAreaView edges={['top']} className="flex-1 bg-white">
                <StyledView className="p-4 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-4 w-full" />
                </StyledView>
            </StyledSafeAreaView>
        );
    }

    if (!news) return null;

    return (
        <StyledSafeAreaView edges={['top']} className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button
                    variant="ghost"
                    size="icon"
                    onPress={() => router.back()}
                    className="rounded-full"
                >
                    <ArrowLeft size={24} color="#000" />
                </Button>
                <StyledText className="font-semibold text-sm">FINE NEWS</StyledText>
                <StyledView className="flex-row items-center space-x-2">
                    {isAdmin && (
                        <>
                            {news.state === 'pending' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full mr-2"
                                    onPress={async () => {
                                        try {
                                            await updateDoc(doc(db, 'news_drafts', id), {
                                                state: 'published',
                                                published_date: serverTimestamp(),
                                                updated_at: serverTimestamp(),
                                                updated_by: auth.currentUser.email
                                            });
                                            Alert.alert('성공', '뉴스가 발행되었습니다.');
                                            router.back();
                                        } catch (e) {
                                            console.error(e);
                                            Alert.alert('오류', '발행 중 문제가 발생했습니다.');
                                        }
                                    }}
                                >
                                    <CheckCircle size={20} color="#16a34a" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full mr-2"
                                onPress={() => router.push(`/news/edit/${id}`)}
                            >
                                <Edit size={20} color="#4f46e5" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onPress={handleShare}
                    >
                        <Share2 size={24} color="#000" />
                    </Button>
                </StyledView>
            </StyledView>

            <StyledScrollView className="flex-1 p-4">
                <StyledText className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                    {news.title}
                </StyledText>
                <StyledText className="text-sm text-gray-500 mb-6">
                    {displayDate
                        ? format(displayDate, 'yyyy.MM.dd. HH:mm', { locale: ko })
                        : '날짜 정보를 불러올 수 없어요'}
                </StyledText>

                {news.image_url && (
                    <StyledView className="aspect-video w-full bg-black mb-6 rounded-lg overflow-hidden">
                        <StyledImage
                            source={{ uri: news.image_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </StyledView>
                )}

                {/* Key Data Points */}
                {news.key_data_points && (
                    <StyledView className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100">
                        <StyledText className="text-sm font-bold text-indigo-900 mb-2">💡 핵심 포인트</StyledText>
                        <StyledText className="text-base text-indigo-900 leading-6 font-medium">
                            {news.key_data_points}
                        </StyledText>
                    </StyledView>
                )}

                <StyledView className="mb-8">
                    {news.content_html ? (
                        <RenderHtml
                            contentWidth={width - 32}
                            source={{ html: news.content_html }}
                            baseStyle={{ fontSize: 16, lineHeight: 24, color: '#374151' }}
                        />
                    ) : (
                        news.content?.split('\n\n').map((paragraph, index) => (
                            <StyledText key={index} className="text-base text-gray-700 mb-4 leading-6">
                                {paragraph}
                            </StyledText>
                        ))
                    )}
                </StyledView>

                {/* Related News Section (Simplified Sheet) */}
                <StyledView className="mt-8 mb-10">
                    <Button
                        className="w-full bg-indigo-600 rounded-full h-12 justify-center items-center"
                        onPress={() => setShowRelated(!showRelated)}
                    >
                        <StyledText className="text-white font-medium">
                            {showRelated ? '관련 뉴스 접기' : '관련 뉴스레터 보기'}
                        </StyledText>
                    </Button>

                    {showRelated && (
                        <StyledView className="mt-4">
                            <StyledText className="text-lg font-bold mb-4">관련 뉴스레터</StyledText>
                            <StyledView className="flex-row flex-wrap justify-between">
                                {relatedNews?.map((relatedItem) => (
                                    <StyledView key={relatedItem.id} className="w-[48%]">
                                        <NewsCard news={relatedItem} />
                                    </StyledView>
                                ))}
                            </StyledView>
                        </StyledView>
                    )}
                </StyledView>
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
