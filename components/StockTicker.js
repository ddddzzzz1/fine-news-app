import React from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function StockTicker() {
    return (
        <StyledView className="bg-white border-t border-gray-200 py-2 px-4">
            <StyledView className="flex-row items-center justify-between">
                <StyledView className="flex-row items-center space-x-2">
                    <StyledText className="text-xs text-gray-600">환율</StyledText>
                    <StyledText className="text-xs font-semibold">1,461.42</StyledText>
                    <StyledText className="text-xs text-blue-600">-0.5%</StyledText>
                </StyledView>
                <StyledView className="flex-row items-center space-x-2">
                    <StyledText className="text-xs text-gray-600">나스닥</StyledText>
                    <StyledText className="text-xs font-semibold">22,870.35</StyledText>
                    <StyledText className="text-xs text-red-600">-2.2%</StyledText>
                </StyledView>
            </StyledView>
        </StyledView>
    );
}
