import { useState, useEffect } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Colors } from "../../constants/colors";
import { useToast } from "../../context/ToastContext";

const STORAGE_KEY = "notification_settings";

interface NotifSettings {
  pushEnabled: boolean;
  noticeEnabled: boolean;
  commentLikeEnabled: boolean;
  scheduleEnabled: boolean;
}

const defaultSettings: NotifSettings = {
  pushEnabled: true,
  noticeEnabled: true,
  commentLikeEnabled: true,
  scheduleEnabled: true,
};

export default function NotificationSettingsScreen() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<NotifSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch (e) { /* ignore */ }
  };

  const updateSetting = async (key: keyof NotifSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    // 전체 푸시 끄면 나머지도 끔
    if (key === "pushEnabled" && !value) {
      newSettings.noticeEnabled = false;
      newSettings.commentLikeEnabled = false;
      newSettings.scheduleEnabled = false;
    }
    // 개별 알림 켜면 전체 푸시도 켬
    if (key !== "pushEnabled" && value) {
      newSettings.pushEnabled = true;
    }
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) { /* ignore */ }
    showToast("알림 설정이 변경되었습니다", "success");
  };

  const items: { key: keyof NotifSettings; icon: string; label: string; desc: string }[] = [
    { key: "pushEnabled", icon: "notifications", label: "푸시 알림", desc: "모든 알림을 받습니다" },
    { key: "noticeEnabled", icon: "megaphone", label: "공지 알림", desc: "새 공지사항 등록 시 알림" },
    { key: "commentLikeEnabled", icon: "chatbubble-ellipses", label: "댓글/좋아요 알림", desc: "내 게시글에 댓글, 좋아요 시 알림" },
    { key: "scheduleEnabled", icon: "calendar", label: "일정 알림", desc: "새 일정 등록, 투표 요청 시 알림" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.gray[50] }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      {items.map((item, index) => (
        <Card key={item.key}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary[50],
              alignItems: "center", justifyContent: "center", marginRight: 14,
            }}>
              <Ionicons name={item.icon as any} size={20} color={Colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>{item.label}</Text>
              <Text style={{ fontSize: 13, color: Colors.gray[500], marginTop: 2 }}>{item.desc}</Text>
            </View>
            <Switch
              value={settings[item.key]}
              onValueChange={(v) => updateSetting(item.key, v)}
              trackColor={{ false: Colors.gray[200], true: Colors.primary[500] }}
              thumbColor="#FFF"
            />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
