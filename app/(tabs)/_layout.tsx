import { useState, useEffect, useCallback } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../../components/ui/Avatar";
import { notices as noticesApi } from "../../lib/api";
import { Colors } from "../../constants/colors";

export default function TabLayout() {
  const { currentTeamId, user } = useAuth();
  const router = useRouter();
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
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [loadUnread]);

  const HeaderLeft = () => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 16 }}>
      <Image
        source={require("../../assets/defe-spirit-logo.png")}
        style={{ width: 28, height: 28 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 17, fontWeight: "800", color: Colors.gray[900] }}>데프스피릿</Text>
    </View>
  );

  const HeaderRight = () => (
    <Pressable onPress={() => router.push("/mypage/")} style={{ marginRight: 16 }}>
      {user?.profileImage ? (
        <Avatar name={user.name} imageUrl={user.profileImage} size={32} />
      ) : (
        <Ionicons name="person-circle-outline" size={32} color={Colors.gray[700]} />
      )}
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.gray[0] },
        headerShadowVisible: false,
        headerTitle: "",
        headerLeft: () => <HeaderLeft />,
        headerRight: () => <HeaderRight />,
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
