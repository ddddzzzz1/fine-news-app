import { Tabs } from "expo-router";
import { Home, Users, CalendarDays, Trophy } from "lucide-react-native";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#4f46e5",
                tabBarInactiveTintColor: "#9ca3af",
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
                name="community"
                options={{
                    title: "커뮤니티",
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
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
        </Tabs>
    );
}
