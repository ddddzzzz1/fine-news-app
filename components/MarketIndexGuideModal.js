import React, { useMemo, useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MARKET_INDEX_CONFIG, MARKET_INDEX_CONFIG_MAP } from "../shared/marketIndices";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledAnimatedView = styled(Animated.View);

const UP_COLOR = "#2BAF74";
const DOWN_COLOR = "#E85858";

const IndexCard = ({ config, live, isSelected, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 50, // Stagger effect
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: index * 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const change = live?.change || config.fallbackChange;
    const isUp = change?.startsWith("+");
    const value = live?.value || config.fallbackValue;
    const [integerPart, decimalPart] = value.split(".");

    return (
        <StyledAnimatedView
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
            className={`mb-6 rounded-[32px] px-6 py-6 shadow-sm ${isSelected ? "bg-white border-l-4 border-l-indigo-500" : "bg-white"
                }`}
        >
            <StyledView className="flex-row items-center justify-between mb-2">
                <StyledView className="flex-row items-center">
                    <StyledText className="text-lg font-bold text-gray-900">{config.label}</StyledText>
                    {isSelected && (
                        <StyledView className="bg-indigo-100 px-2 py-0.5 rounded-full">
                            <StyledText className="text-[10px] font-bold text-indigo-600">SELECTED</StyledText>
                        </StyledView>
                    )}
                </StyledView>
                <StyledView className="flex-row items-baseline">
                    <StyledText className="text-xl font-extrabold text-gray-900">{integerPart}</StyledText>
                    {decimalPart && (
                        <StyledText className="text-base font-bold text-gray-900">.{decimalPart}</StyledText>
                    )}
                </StyledView>
            </StyledView>

            {change && (
                <StyledView className="flex-row items-center justify-between mb-3">
                    <StyledText
                        className="text-sm font-bold"
                        style={{ color: isUp ? UP_COLOR : DOWN_COLOR }}
                    >
                        {change}
                    </StyledText>
                    <StyledText className="text-[10px] text-gray-400">Last updated 15m</StyledText>
                </StyledView>
            )}

            <StyledText className="text-[15px] text-gray-700 leading-7 mb-4">
                {config.summary}
            </StyledText>

            {config.insights?.length ? (
                <StyledView className="space-y-2 bg-gray-50 p-4 rounded-2xl">
                    {config.insights.map((insight) => (
                        <StyledView key={insight} className="flex-row items-start">
                            <StyledText className="text-gray-400 mr-2 mt-0.5">◦</StyledText>
                            <StyledText className="text-xs text-gray-600 flex-1 leading-5">
                                {insight.split(/(금리|모멘텀|외국인 수급|환율)/g).map((part, i) =>
                                    ["금리", "모멘텀", "외국인 수급", "환율"].includes(part) ? (
                                        <StyledText key={i} className="font-bold text-gray-800">
                                            {part}
                                        </StyledText>
                                    ) : (
                                        part
                                    )
                                )}
                            </StyledText>
                        </StyledView>
                    ))}
                </StyledView>
            ) : null}

            <StyledText className="text-[10px] text-gray-400 mt-3 text-right">
                {config.dataSource}
            </StyledText>
        </StyledAnimatedView>
    );
};

export default function MarketIndexGuideModal({ visible, onClose, selectedIndexId, indices = [] }) {
    const insets = useSafeAreaInsets();
    const indexValueMap = useMemo(() => {
        return indices.reduce((acc, item) => {
            acc[item.id] = item;
            return acc;
        }, {});
    }, [indices]);

    const headerPaddingTop = (insets.top || 0) + 16;

    // Sort indices so selected one is first, or just keep default order?
    // User request implies "Selected Index" area might be separate, but the design 
    // suggests a unified list where the selected one is highlighted. 
    // Let's stick to the list but highlight the selected one as requested.

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <LinearGradient
                colors={["#FFFFFF", "#FAFBFF"]}
                style={{ flex: 1 }}
            >
                <StyledSafeAreaView className="flex-1">
                    <StyledView
                        className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-100/50"
                        style={{ paddingTop: headerPaddingTop }}
                    >
                        <StyledText className="text-2xl font-bold text-gray-900">지수 안내</StyledText>
                        <TouchableOpacity
                            onPress={onClose}
                            className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                        >
                            <X size={18} color="#374151" />
                        </TouchableOpacity>
                    </StyledView>

                    <StyledScrollView
                        className="flex-1"
                        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {MARKET_INDEX_CONFIG.map((config, index) => {
                            const live = indexValueMap[config.id];
                            const isSelected = config.id === selectedIndexId;
                            return (
                                <IndexCard
                                    key={config.id}
                                    config={config}
                                    live={live}
                                    isSelected={isSelected}
                                    index={index}
                                />
                            );
                        })}

                        <StyledText className="text-xs text-gray-400 text-center mt-4">
                            * 실시간 지수 연동은 API 확정 후 순차 배포됩니다.
                        </StyledText>
                    </StyledScrollView>
                </StyledSafeAreaView>
            </LinearGradient>
        </Modal>
    );
}
