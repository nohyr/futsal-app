import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNotices, useTeam } from "../../hooks/useSupabase";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";

const categoryConfig: Record<string, { label: string; variant: "primary" | "success" | "warning" | "danger" | "neutral" }> = {
  general: { label: "일반", variant: "neutral" },
  schedule: { label: "일정", variant: "primary" },
  location: { label: "장소", variant: "success" },
  fee: { label: "회비", variant: "warning" },
  uniform: { label: "유니폼", variant: "danger" },
};

export default function NoticeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { team } = useTeam();
  const { notices, loading } = useNotices();

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.users?.auth_id === user?.id || m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";

  const pinned = notices.filter((n: any) => n.is_pinned);
  const others = notices.filter((n: any) => !n.is_pinned);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
        {notices.length === 0 ? (
          <Card>
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Ionicons name="megaphone-outline" size={32} color={Colors.gray[300]} />
              <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>아직 공지가 없습니다</Text>
            </View>
          </Card>
        ) : (
          <>
            {pinned.map((notice: any) => {
              const config = categoryConfig[notice.category] || categoryConfig.general;
              return (
                <Card key={notice.id} variant="warm">
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Ionicons name="pin" size={14} color={Colors.warm[500]} />
                    <Badge label={config.label} variant={config.variant} />
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{notice.created_at?.slice(0, 10)}</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 6 }}>{notice.title}</Text>
                  <Text style={{ fontSize: 14, color: Colors.gray[700] }} numberOfLines={2}>{notice.content}</Text>
                </Card>
              );
            })}
            {others.map((notice: any) => {
              const config = categoryConfig[notice.category] || categoryConfig.general;
              return (
                <Card key={notice.id}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Badge label={config.label} variant={config.variant} />
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{notice.created_at?.slice(0, 10)}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.gray[900], marginBottom: 4 }}>{notice.title}</Text>
                  <Text style={{ fontSize: 14, color: Colors.gray[700] }} numberOfLines={2}>{notice.content}</Text>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      {isAdmin && (
        <Pressable
          onPress={() => router.push("/create-notice/")}
          style={{
            position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
            backgroundColor: Colors.primary[500], alignItems: "center", justifyContent: "center",
            shadowColor: Colors.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
          }}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      )}
    </View>
  );
}
