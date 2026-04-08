import { useState, useEffect, useCallback } from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { notices as noticesApi } from "../../lib/api";
import { Colors } from "../../constants/colors";

export default function TabLayout() {
  const { currentTeamId } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    if (!currentTeamId) return;
    try {
      const count = await noticesApi.getUnreadCount(currentTeamId);
      setUnreadCount(count);
    } catch (e) { /* ignore */ }
  }, [currentTeamId]);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, [loadUnread]);

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
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="megaphone" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: "absolute", top: -4, right: -8,
                  backgroundColor: Colors.danger[500], borderRadius: 8,
                  minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
        listeners={{ focus: () => { loadUnread(); } }}
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
