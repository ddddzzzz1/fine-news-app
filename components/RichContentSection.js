import React, { useMemo } from "react";
import { View, Text } from "react-native";
import RenderHTML from "react-native-render-html";
import { styled } from "nativewind";
import { buildContestHtmlBlock } from "../shared/contestRichText";

const StyledView = styled(View);
const StyledText = styled(Text);

export default function RichContentSection({ label, value, contentWidth }) {
    const html = useMemo(() => buildContestHtmlBlock(value), [value]);

    if (!html) {
        return null;
    }

    return (
        <StyledView className="mb-6">
            {label ? <StyledText className="text-sm text-gray-500 mb-2">{label}</StyledText> : null}
            <RenderHTML
                contentWidth={Math.max(contentWidth, 0)}
                source={{ html }}
                tagsStyles={{
                    div: { color: "#1f2937", fontSize: 16, lineHeight: 24 },
                    p: { marginBottom: 8 },
                    ul: { marginBottom: 12, paddingLeft: 20 },
                    ol: { marginBottom: 12, paddingLeft: 20 },
                    li: { marginBottom: 6 },
                }}
                baseStyle={{ color: "#1f2937", fontSize: 16, lineHeight: 24 }}
            />
        </StyledView>
    );
}
