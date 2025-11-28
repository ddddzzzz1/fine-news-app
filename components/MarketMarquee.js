import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { styled } from "nativewind";
import { RefreshCw } from "lucide-react-native";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const formatUpdatedLabel = (timestamp) => {
    if (!timestamp) return null;
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return null;
    return format(parsed, "M/d HH:mm 기준", { locale: ko });
};

export default function MarketMarquee({
    indices = [],
    onChipPress,
    onRefresh,
    isRefreshing,
    lastUpdatedAt,
}) {
    if (!indices.length) return null;

    const scrollAnim = useRef(new Animated.Value(0)).current;
    const [distance, setDistance] = useState(0);
    const repeatedItems = useMemo(() => [...indices, ...indices], [indices]);
    const updatedLabel = formatUpdatedLabel(lastUpdatedAt);

    useEffect(() => {
        scrollAnim.setValue(0);
        if (!distance) return undefined;
        const animation = Animated.loop(
            Animated.timing(scrollAnim, {
                toValue: 1,
                duration: Math.max(distance * 25, 12000),
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );
        animation.start();
        return () => animation.stop();
    }, [distance, indices.length, scrollAnim]);

    const translateX =
        distance > 0
            ? scrollAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -distance],
              })
            : 0;

    const handleContentLayout = useCallback((event) => {
        const width = event?.nativeEvent?.layout?.width;
        if (width && width / 2 !== distance) {
            setDistance(width / 2);
        }
    }, [distance]);

    return (
        <StyledView className="px-4 mt-6">
            <StyledView className="flex-row items-center justify-between mb-2">
                <StyledText className="text-sm font-semibold text-gray-600">라이브 마켓 인덱스</StyledText>
                <StyledView className="flex-row items-center space-x-2">
                    {updatedLabel && <StyledText className="text-[11px] text-gray-400">{updatedLabel}</StyledText>}
                    {onRefresh && (
                        <StyledTouchableOpacity
                            className={`flex-row items-center border border-gray-200 rounded-full px-2 py-1 ${
                                isRefreshing ? "opacity-60" : ""
                            }`}
                            onPress={onRefresh}
                            disabled={isRefreshing}
                            activeOpacity={0.8}
                        >
                            <RefreshCw size={14} color="#4b5563" />
                            <StyledText className="text-[11px] text-gray-600 ml-1">
                                {isRefreshing ? "업데이트 중" : "새로고침"}
                            </StyledText>
                        </StyledTouchableOpacity>
                    )}
                </StyledView>
            </StyledView>

            <StyledView
                className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-md"
                style={{ paddingVertical: 10 }}
            >
                <StyledView onLayout={handleContentLayout}>
                    <Animated.View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 20,
                            transform: distance > 0 ? [{ translateX }] : undefined,
                        }}
                    >
                        {repeatedItems.map((item, idx) => {
                            const isUp = item.change?.startsWith("+");
                            const borderColor = isUp ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
                            const textColor = isUp ? "#16a34a" : "#dc2626";
                            return (
                                <StyledTouchableOpacity
                                    key={`${item.id}-${idx}`}
                                    className="px-3"
                                    style={{ marginRight: 12 }}
                                    onPress={() => onChipPress?.(item)}
                                    activeOpacity={0.85}
                                >
                                    <StyledView
                                        className="px-4 py-2 rounded-full bg-white/90"
                                        style={{ borderWidth: 1, borderColor }}
                                    >
                                        <StyledText className="text-xs font-semibold text-gray-500 mb-0.5">
                                            {item.label}
                                        </StyledText>
                                        <StyledView className="flex-row items-center space-x-2">
                                            <StyledText className="text-base font-bold text-gray-900">
                                                {item.value}
                                            </StyledText>
                                            {item.change && (
                                                <StyledText className="text-sm font-semibold" style={{ color: textColor }}>
                                                    {item.change}
                                                </StyledText>
                                            )}
                                        </StyledView>
                                    </StyledView>
                                </StyledTouchableOpacity>
                            );
                        })}
                    </Animated.View>
                </StyledView>
            </StyledView>
        </StyledView>
    );
}
