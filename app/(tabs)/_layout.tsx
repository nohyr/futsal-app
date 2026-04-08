import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.gray[0] },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 20, fontWeight: "700", color: Colors.gray[900] },
        tabBarStyle: {
          backgroundColor: Colors.gray[0],
          borderTopColor: Colors.gray[200],
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.gray[500],
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "일정",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: "기록",
          tabBarIcon: ({ color, size }) => <Ionicons name="archive" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notice"
        options={{
          title: "공지",
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "팀",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
