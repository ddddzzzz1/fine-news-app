import React, { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { X } from "lucide-react-native";
import { MARKET_INDEX_CONFIG, MARKET_INDEX_CONFIG_MAP } from "../shared/marketIndices";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

export default function MarketIndexGuideModal({ visible, onClose, selectedIndexId, indices = [] }) {
    const insets = useSafeAreaInsets();
    const indexValueMap = useMemo(() => {
        return indices.reduce((acc, item) => {
            acc[item.id] = item;
            return acc;
        }, {});
    }, [indices]);

    const currentSelection = MARKET_INDEX_CONFIG_MAP[selectedIndexId] || MARKET_INDEX_CONFIG[0];
    const headerPaddingTop = (insets.top || 0) + 16;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <StyledSafeAreaView className="flex-1 bg-white">
                <StyledView
                    className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
                    style={{ paddingTop: headerPaddingTop }}
                >
                    <StyledText className="text-lg font-bold text-gray-900">지수 안내</StyledText>
                    <TouchableOpacity onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full">
                        <X size={20} color="#111827" />
                    </TouchableOpacity>
                </StyledView>
                <StyledScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                    <StyledView className="mb-5 p-4 rounded-3xl bg-indigo-50 border border-indigo-100">
                        <StyledText className="text-sm text-indigo-600 mb-1">선택한 지수</StyledText>
                        <StyledText className="text-2xl font-bold text-gray-900 mb-1">
                            {currentSelection?.label}
                        </StyledText>
                        <StyledText className="text-sm text-gray-700">
                            {currentSelection?.summary}
                        </StyledText>
                        {currentSelection?.session && (
                            <StyledText className="text-xs text-gray-500 mt-3">
                                거래 시간 · {currentSelection.session}
                            </StyledText>
                        )}
                    </StyledView>

                    {MARKET_INDEX_CONFIG.map((config) => {
                        const live = indexValueMap[config.id];
                        const isSelected = config.id === selectedIndexId;
                        const change = live?.change || config.fallbackChange;
                        const isUp = change?.startsWith("+");
                        return (
                            <StyledView
                                key={config.id}
                                className={`mb-4 rounded-3xl border px-4 py-4 ${
                                    isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-gray-50"
                                }`}
                            >
                                <StyledView className="flex-row items-center justify-between mb-1">
                                    <StyledText className="text-base font-bold text-gray-900">{config.label}</StyledText>
                                    <StyledText className="text-base font-semibold text-gray-900">
                                        {live?.value || config.fallbackValue}
                                    </StyledText>
                                </StyledView>
                                {change && (
                                    <StyledText
                                        className="text-xs font-semibold mb-2"
                                        style={{ color: isUp ? "#16a34a" : "#dc2626" }}
                                    >
                                        {change}
                                    </StyledText>
                                )}
                                <StyledText className="text-sm text-gray-700 leading-6">
                                    {config.summary}
                                </StyledText>
                                {config.insights?.length ? (
                                    <StyledView className="mt-3 space-y-1">
                                        {config.insights.map((insight) => (
                                            <StyledText key={insight} className="text-xs text-gray-600">
                                                • {insight}
                                            </StyledText>
                                        ))}
                                    </StyledView>
                                ) : null}
                                <StyledText className="text-[11px] text-gray-500 mt-3">
                                    {config.dataSource}
                                </StyledText>
                            </StyledView>
                        );
                    })}

                    <StyledText className="text-xs text-gray-400">
                        * 실시간 지수 연동은 API 확정 후 순차 배포됩니다.
                    </StyledText>
                </StyledScrollView>
            </StyledSafeAreaView>
        </Modal>
    );
}
