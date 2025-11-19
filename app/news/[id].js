import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '../../components/ui/skeleton';
import NewsCard from '../../components/NewsCard';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

export default function NewsDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [showRelated, setShowRelated] = useState(false);

    const { data: news, isLoading } = useQuery({
        queryKey: ['news', id],
        queryFn: async () => {
            if (!id) return null;
            const docRef = doc(db, 'news', id);
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
                const q = query(collection(db, 'news'), orderBy('published_date', 'desc'), limit(6));
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
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Share2 size={24} color="#000" />
                </Button>
            </StyledView>

            <StyledScrollView className="flex-1 p-4">
                <StyledText className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                    {news.title}
                </StyledText>
                <StyledText className="text-sm text-gray-500 mb-6">
                    {format(new Date(news.published_date || news.created_date), 'yyyy.MM.dd. HH:mm', { locale: ko })}
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

                <StyledView className="mb-8">
                    {news.content?.split('\n\n').map((paragraph, index) => (
                        <StyledText key={index} className="text-base text-gray-700 mb-4 leading-6">
                            {paragraph}
                        </StyledText>
                    ))}
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
