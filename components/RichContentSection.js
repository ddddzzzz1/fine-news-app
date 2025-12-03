import React from "react";
import { View, Text } from "react-native";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);

export default function RichContentSection({ label, value }) {
    if (!value) {
        return null;
    }

    return (
        <StyledView className="mb-6">
            {label ? <StyledText className="text-sm text-gray-500 mb-2">{label}</StyledText> : null}
            <StyledText className="text-base text-gray-900 leading-6">
                {value}
            </StyledText>
        </StyledView>
    );
}
