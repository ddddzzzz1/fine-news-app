import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styled } from "nativewind";
import { RefreshCw } from "lucide-react-native";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const formatUpdatedTime = (timestamp) => {
    if (!timestamp) return null;
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return null;
    return format(parsed, "M/d HH:mm", { locale: ko });
};

export default function StockTicker({ indices = [], onPressIndex, onRefresh, isRefreshing, lastUpdatedAt }) {
    if (!indices.length) return null;

    const updatedLabel = formatUpdatedTime(lastUpdatedAt);

    return (
        <StyledView className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
            <StyledView className="flex-row items-center justify-between mb-3">
                <StyledText className="text-xs font-semibold text-gray-500">실시간 마켓 인덱스</StyledText>
                <StyledView className="flex-row items-center">
                    {updatedLabel && (
                        <StyledText className="text-[11px] text-gray-400 mr-2">{updatedLabel} 기준</StyledText>
                    )}
                    {onRefresh && (
                        <StyledTouchableOpacity
                            className={`flex-row items-center border border-gray-200 rounded-full px-2 py-1 ${
                                isRefreshing ? "opacity-60" : ""
                            }`}
                            onPress={onRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw size={14} color="#4b5563" />
                            <StyledText className="text-[11px] text-gray-600 ml-1">
                                {isRefreshing ? "업데이트 중" : "새로고침"}
                            </StyledText>
                        </StyledTouchableOpacity>
                    )}
                </StyledView>
            </StyledView>
            <StyledScrollView horizontal showsHorizontalScrollIndicator={false}>
                {indices.map((item) => {
                    const isUp = item.change?.startsWith("+");
                    const color = isUp ? "#16a34a" : "#dc2626";
                    return (
                        <StyledTouchableOpacity
                            key={item.id}
                            className="mr-4"
                            onPress={() => onPressIndex?.(item)}
                            activeOpacity={0.8}
                        >
                            <StyledText className="text-xs text-gray-500">{item.label}</StyledText>
                            <StyledText className="text-sm font-semibold text-gray-900">{item.value}</StyledText>
                            {item.change && (
                                <StyledText className="text-xs font-semibold" style={{ color }}>
                                    {item.change}
                                </StyledText>
                            )}
                        </StyledTouchableOpacity>
                    );
                })}
            </StyledScrollView>
        </StyledView>
    );
}
