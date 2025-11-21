import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react-native";
import { Skeleton } from "../../components/ui/skeleton";
import StockTicker from "../../components/StockTicker";
import MarketIndexGuideModal from "../../components/MarketIndexGuideModal";
import { useMarketIndices } from "../../hooks/useMarketIndices";
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);

const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value.seconds) {
        return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function NewsletterDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { indices: displayIndices } = useMarketIndices();
    const keyboardVisible = useKeyboardVisible();
    const [showIndexModal, setShowIndexModal] = useState(false);
    const [selectedIndexId, setSelectedIndexId] = useState(displayIndices[0]?.id ?? "nasdaq");

    const { data: newsletter, isLoading } = useQuery({
        queryKey: ["newsletters", id],
        enabled: Boolean(id),
        queryFn: async () => {
            const ref = doc(db, "newsletters", id);
            const snap = await getDoc(ref);
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        },
    });

    useEffect(() => {
        if (!selectedIndexId && displayIndices.length) {
            setSelectedIndexId(displayIndices[0].id);
        }
    }, [displayIndices, selectedIndexId]);

    const handleOpenIndexModal = (item) => {
        setSelectedIndexId(item?.id ?? displayIndices[0]?.id ?? "nasdaq");
        setShowIndexModal(true);
    };

    const bottomInset = Math.max(insets.bottom, 16);
    const showIndexBar = displayIndices.length > 0 && !keyboardVisible;
    const scrollPaddingBottom = showIndexBar ? bottomInset + 76 + 40 : 32;

    if (isLoading) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
                <StyledView className="p-4 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-4 w-full" />
                </StyledView>
            </StyledSafeAreaView>
        );
    }

    if (!newsletter) {
        return (
            <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
                <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                    <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                        <ArrowLeft size={22} color="#111827" />
                    </Button>
                    <StyledText className="text-sm font-semibold text-gray-900">뉴스레터</StyledText>
                    <View style={{ width: 44 }} />
                </StyledView>
                <StyledView className="flex-1 items-center justify-center px-6">
                    <StyledText className="text-base text-gray-500 text-center">
                        뉴스레터를 찾을 수 없습니다.
                    </StyledText>
                </StyledView>
            </StyledSafeAreaView>
        );
    }

    const publishedDate = toDate(newsletter.published_date) || toDate(newsletter.created_date);

    return (
        <StyledSafeAreaView edges={["top"]} className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="text-sm font-semibold text-gray-900">
                    {newsletter.source || "뉴스레터"}
                </StyledText>
                <View style={{ width: 44 }} />
            </StyledView>

            <StyledScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}>
                <StyledText className="text-2xl font-bold text-gray-900 mb-3">
                    {newsletter.title}
                </StyledText>
                {newsletter.subtitle && (
                    <StyledText className="text-base text-gray-600 mb-1">
                        {newsletter.subtitle}
                    </StyledText>
                )}
                {publishedDate && (
                    <StyledText className="text-xs text-gray-500 mb-5">
                        {publishedDate.toLocaleDateString("ko-KR")}
                    </StyledText>
                )}

                {newsletter.image_url ? (
                    <StyledView className="mb-6 rounded-2xl overflow-hidden bg-gray-100">
                        <StyledImage
                            source={{ uri: newsletter.image_url }}
                            className="w-full h-48"
                            resizeMode="cover"
                        />
                    </StyledView>
                ) : null}

                <StyledView className="space-y-4">
                    {newsletter.content?.split("\n\n").map((para, idx) => (
                        <StyledText key={idx} className="text-base text-gray-700 leading-6">
                            {para}
                        </StyledText>
                    ))}
                </StyledView>

                {!!newsletter.tags?.length && (
                    <StyledView className="mt-8 flex-row flex-wrap -m-1">
                        {newsletter.tags.map((tag) => (
                            <StyledView key={tag} className="m-1 rounded-full bg-indigo-50 px-3 py-1">
                                <StyledText className="text-xs font-semibold text-indigo-700">#{tag}</StyledText>
                            </StyledView>
                        ))}
                    </StyledView>
                )}
            </StyledScrollView>

            {showIndexBar && (
                <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: bottomInset }}>
                    <StockTicker indices={displayIndices} onPressIndex={handleOpenIndexModal} />
                </View>
            )}

            <MarketIndexGuideModal
                visible={showIndexModal}
                onClose={() => setShowIndexModal(false)}
                selectedIndexId={selectedIndexId}
                indices={displayIndices}
            />
        </StyledSafeAreaView>
    );
}
