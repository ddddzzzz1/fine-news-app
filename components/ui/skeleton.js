import { Animated } from "react-native";
import { cn } from "../../lib/utils";
import { styled } from "nativewind";
import { useEffect, useRef } from "react";

const StyledAnimatedView = styled(Animated.View);

function Skeleton({ className, ...props }) {
    const opacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <StyledAnimatedView
            style={{ opacity }}
            className={cn("rounded-md bg-gray-200", className)}
            {...props}
        />
    );
}

export { Skeleton };
