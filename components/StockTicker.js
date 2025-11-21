import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

export default function StockTicker({ indices = [], onPressIndex }) {
    if (!indices.length) return null;

    return (
        <StyledView className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
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
