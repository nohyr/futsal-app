import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useSchedules } from "../../hooks/useSupabase";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";

export default function MySchedulesScreen() {
  const { user } = useAuth();
  const { schedules, loading } = useSchedules();

  const mySchedules = schedules.filter((s: any) =>
    (s.attendances || []).some((a: any) => a.user_id === user?.id && (a.status === "attending" || a.checked_in))
  ).sort((a: any, b: any) => b.date.localeCompare(a.date));

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.gray[50] }} contentContainerStyle={{ padding: 20, gap: 8 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 14, color: Colors.gray[500], marginBottom: 8 }}>총 {mySchedules.length}건</Text>

      {mySchedules.length === 0 ? (
        <Card>
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Ionicons name="calendar-outline" size={32} color={Colors.gray[300]} />
            <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>참여한 일정이 없습니다</Text>
          </View>
        </Card>
      ) : (
        mySchedules.map((s: any) => {
          const myAtt = (s.attendances || []).find((a: any) => a.user_id === user?.id);
          return (
            <Card key={s.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Badge
                  label={s.type === "match" ? "경기" : s.type === "training" ? "훈련" : "모임"}
                  variant={s.type === "match" ? "primary" : "neutral"}
                />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: Colors.gray[900] }}>
                  {s.opponent ? `vs ${s.opponent}` : s.description || ""}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{s.date}</Text>
                {myAtt?.checked_in && <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />}
              </View>
              <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 4 }}>{s.time} · {s.location}</Text>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}
