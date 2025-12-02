import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { PushNotificationsProvider } from "../context/PushNotificationsContext";
import { ThemeProvider } from "../context/ThemeContext";
import SplashScreen from "../components/SplashScreen";

const queryClient = new QueryClient();

export default function RootLayout() {
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setAuthReady(true);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSplashMinTimeElapsed(true);
        }, 2000); // Show splash for at least 2 seconds
        return () => clearTimeout(timer);
    }, []);

    const isReady = authReady && splashMinTimeElapsed;

    if (!isReady) {
        return (
            <SafeAreaProvider>
                <SplashScreen />
            </SafeAreaProvider>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
                <ThemeProvider>
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
                                <Stack.Screen name="notification-settings" />
                                <Stack.Screen name="account-nickname" />
                                <Stack.Screen name="account-password" />
                            </Stack>
                        ) : (
                            <Stack screenOptions={{ headerShown: false }}>
                                <Stack.Screen name="login" />
                                <Stack.Screen name="register" />
                            </Stack>
                        )}
                    </PushNotificationsProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </QueryClientProvider>
    );
}
