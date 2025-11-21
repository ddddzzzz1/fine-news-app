import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { View, ActivityIndicator } from "react-native";
import { PushNotificationsProvider } from "../context/PushNotificationsContext";

const queryClient = new QueryClient();

export default function RootLayout() {
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setAuthReady(true);
        });
        return unsubscribe;
    }, []);

    if (!authReady) {
        return (
            <SafeAreaProvider>
                <View className="flex-1 items-center justify-center bg-white">
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
                <PushNotificationsProvider user={user}>
                    {user ? (
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen name="news/[id]" />
                            <Stack.Screen name="newsletters/[id]" />
                            <Stack.Screen name="community/[id]" />
                            <Stack.Screen name="contest/[id]" />
                            <Stack.Screen name="calendar-day/[date]" />
                            <Stack.Screen name="saved-contests" />
                            <Stack.Screen name="my-posts" />
                            <Stack.Screen name="write-post" />
                            <Stack.Screen name="university-verification" />
                            <Stack.Screen name="search" />
                            <Stack.Screen name="help" />
                        </Stack>
                    ) : (
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="login" />
                            <Stack.Screen name="register" />
                        </Stack>
                    )}
                </PushNotificationsProvider>
            </SafeAreaProvider>
        </QueryClientProvider>
    );
}
