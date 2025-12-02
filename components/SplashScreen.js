import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import { styled } from 'nativewind';
import LottieView from 'lottie-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function SplashScreen() {
    // useRef so the Animated.Value isn't recreated on every render
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <StyledView className="flex-1 items-center justify-center bg-white">
            {/* Tree animation */}
            <LottieView
                source={require('../assets/christmas-tree.json')}
                autoPlay
                loop
                style={{ width: 200, height: 200, marginBottom: 24 }}
            />

            {/* Fade-in logo and text */}
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                <StyledImage
                    source={require('../assets/splash-icon.png')}
                    className="w-32 h-32 mb-4"
                    resizeMode="contain"
                />
                <StyledText className="text-2xl font-bold text-indigo-600 tracking-widest">
                    FINE
                </StyledText>
                <StyledText className="text-sm text-gray-500 mt-2 tracking-wider">
                    Finance IN Everyday
                </StyledText>
            </Animated.View>
        </StyledView>
    );
}
