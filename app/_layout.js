import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="news/[id]" />
                </Stack>
            </SafeAreaProvider>
        </QueryClientProvider>
    );
}
