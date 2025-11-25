import { Tabs } from "expo-router";
import { Home, CalendarDays, Trophy, Users, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const baseHeight = 56;
    const bottomPadding = insets.bottom > 0 ? insets.bottom : 12;
    const tabBarHeight = baseHeight + bottomPadding;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#4f46e5",
                tabBarInactiveTintColor: "#9ca3af",
                tabBarStyle: {
                    height: tabBarHeight,
                    paddingBottom: bottomPadding,
                    paddingTop: 8,
                    borderTopColor: "#e5e7eb",
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "홈",
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: "캘린더",
                    tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="contests"
                options={{
                    title: "공모전",
                    tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="community"
                options={{
                    title: "커뮤니티",
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "마이",
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
