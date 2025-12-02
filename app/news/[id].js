import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Share, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ArrowLeft, Share2, CheckCircle, Briefcase, TrendingUp, Lightbulb } from 'lucide-react-native';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '../../components/ui/skeleton';
import NewsCard from '../../components/NewsCard';
import RenderHtml from 'react-native-render-html';
import { styled } from 'nativewind';
import { auth } from '../../firebaseConfig';
import { Edit } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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

const parseKeyPointPairs = (raw) => {
    if (typeof raw === "object" && raw !== null) {
        return raw;
    }
    if (typeof raw === "string") {
        return raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const [label, ...rest] = line.split(':');
                return {
                    label: label?.trim() || "",
                    value: rest.join(':').trim(),
                };
            })
            .filter((item) => item.label && item.value);
    }
    return null;
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

                {/* Key Data Points or Impact Analysis */}
                {news.impact_analysis ? (
                    <ImpactAnalysisCard analysis={news.impact_analysis} />
                ) : (
                    news.key_data_points && <KeyImpactCard text={news.key_data_points} />
                )}

                <StyledView className="mb-8">
                    {news.content_html ? (
                        <RenderHtml
                            contentWidth={width - 32}
                            source={{ html: news.content_html }}
                            baseStyle={{ fontSize: 17, lineHeight: 28, color: '#1f2937' }}
                        />
                    ) : (
                        news.content?.split('\n\n').map((paragraph, index) => (
                            <StyledText key={index} className="text-[17px] text-gray-800 mb-5 leading-7">
                                {paragraph}
                            </StyledText>
                        ))
                    )}
                </StyledView>

                {/* Related News Section */}
                <StyledView className="mt-8 mb-10">
                    <TouchableOpacity
                        className="flex-row items-center justify-between mb-3"
                        onPress={() => setShowRelated((prev) => !prev)}
                        activeOpacity={0.8}
                    >
                        <StyledText className="text-lg font-bold text-gray-900">관련 뉴스레터</StyledText>
                        <Ionicons
                            name={showRelated ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#4b5563"
                        />
                    </TouchableOpacity>

                    {showRelated && (
                        <StyledView className="flex-row flex-wrap justify-between">
                            {relatedNews?.map((relatedItem) => (
                                <StyledView key={relatedItem.id} className="w-[48%] mb-4">
                                    <NewsCard news={relatedItem} />
                                </StyledView>
                            ))}
                        </StyledView>
                    )}
                </StyledView>
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}

function KeyImpactCard({ text }) {
    const parsed = parseKeyPointPairs(text);
    if (!parsed) return null;

    let primary = null;
    let secondary = [];
    let extra = [];

    if (Array.isArray(parsed)) {
        primary = parsed[0];
        secondary = parsed.slice(1, 3);
        extra = parsed.slice(3);
    } else {
        primary = parsed.hero || parsed.main || null;
        if (!primary && typeof parsed === "object") {
            const firstEntry = Array.isArray(parsed.details) ? parsed.details[0] : null;
            primary = firstEntry || null;
        }
        secondary = Array.isArray(parsed.details) ? parsed.details.slice(0, 2) : [];
        extra = Array.isArray(parsed.highlights)
            ? parsed.highlights.map((item) => ({
                label: item.tag || "Highlight",
                value: item.text || "",
            }))
            : [];
    }

    if (!primary) return null;

    const renderValue = (value = "") => {
        if (typeof value !== "string") return value?.toString?.() || "";
        return value.replace(/\(.*?\)/, "").trim();
    };
    const extractTag = (value = "") => {
        if (typeof value !== "string") return null;
        const match = value.match(/\((.+)\)/);
        return match ? match[1] : null;
    };

    return (
        <StyledView className="mb-6">
            <LinearGradient
                colors={["#eff6ff", "#eef2ff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#dbeafe" }}
            >
                <StyledView className="flex-row items-center mb-4">
                    <Ionicons name="flash" size={16} color="#4338ca" />
                    <StyledText className="text-[11px] font-bold text-indigo-700 ml-2">
                        KEY IMPACT
                    </StyledText>
                </StyledView>

                <StyledView className="mb-4 pb-4 border-b border-indigo-100">
                    <StyledText className="text-xs uppercase tracking-wide text-indigo-500 mb-2">
                        {primary.label || primary.title || "Key Metric"}
                    </StyledText>
                    <StyledView className="flex-row items-end flex-wrap">
                        <StyledText className="text-4xl font-black text-gray-900">
                            {renderValue(primary.value || primary.metric)}
                        </StyledText>
                        {(primary.unit || extractTag(primary.value || primary.metric)) && (
                            <StyledText className="ml-2 mb-2 text-sm font-bold text-indigo-600">
                                {primary.unit || extractTag(primary.value || primary.metric)}
                            </StyledText>
                        )}
                    </StyledView>
                    {primary.insight && (
                        <StyledText className="text-xs text-indigo-600 mt-1 font-semibold">
                            {primary.insight}
                        </StyledText>
                    )}
                </StyledView>

                {secondary.length > 0 && (
                    <StyledView className="flex-row items-center">
                        {secondary.map((item, idx) => (
                            <React.Fragment key={`${item.label}-${idx}`}>
                                {idx === 1 && <StyledView className="w-px h-12 bg-indigo-100" />}
                                <StyledView className="flex-1 px-3">
                                    <StyledText className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                                        {item.label}
                                    </StyledText>
                                    <StyledText className="text-lg font-bold text-gray-900">
                                        {renderValue(item.value)}
                                        {extractTag(item.value) && (
                                            <Text className="text-xs text-red-500 font-semibold"> ({extractTag(item.value)})</Text>
                                        )}
                                    </StyledText>
                                    {item.note && (
                                        <StyledText className="text-xs text-gray-500 mt-0.5">
                                            {item.note}
                                        </StyledText>
                                    )}
                                </StyledView>
                            </React.Fragment>
                        ))}
                    </StyledView>
                )}

                {!!extra.length && (
                    <StyledView className="mt-4 pt-3 border-t border-indigo-100">
                        {extra.map((item, idx) => (
                            <StyledText key={`${item.label}-${idx}`} className="text-sm text-gray-700 mb-1.5">
                                <Text className="font-semibold text-gray-900">{item.label}: </Text>
                                {item.value}
                            </StyledText>
                        ))}
                    </StyledView>
                )}
            </LinearGradient>
        </StyledView>
    );

}

function ImpactAnalysisCard({ analysis }) {
    if (!analysis) return null;

    return (
        <StyledView className="mb-6">
            <LinearGradient
                colors={["#f0f9ff", "#e0f2fe"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#bae6fd" }}
            >
                <StyledView className="flex-row items-center mb-4">
                    <Lightbulb size={18} color="#0284c7" />
                    <StyledText className="text-xs font-bold text-sky-700 ml-2">
                        WHY IT MATTERS
                    </StyledText>
                </StyledView>

                {/* Investment Insight */}
                {analysis.investment && (
                    <StyledView className="mb-4">
                        <StyledView className="flex-row items-center mb-2">
                            <TrendingUp size={16} color="#0369a1" />
                            <StyledText className="text-sm font-bold text-sky-900 ml-2">
                                투자 관점
                            </StyledText>
                        </StyledView>
                        <StyledText className="text-base text-sky-950 leading-6 bg-white/60 p-3 rounded-xl overflow-hidden">
                            {analysis.investment}
                        </StyledText>
                    </StyledView>
                )}

                {/* Employment Insight */}
                {analysis.employment && (
                    <StyledView>
                        <StyledView className="flex-row items-center mb-2">
                            <Briefcase size={16} color="#0369a1" />
                            <StyledText className="text-sm font-bold text-sky-900 ml-2">
                                취업/커리어 관점
                            </StyledText>
                        </StyledView>
                        <StyledText className="text-base text-sky-950 leading-6 bg-white/60 p-3 rounded-xl overflow-hidden">
                            {analysis.employment}
                        </StyledText>
                    </StyledView>
                )}
            </LinearGradient>
        </StyledView>
    );
}
