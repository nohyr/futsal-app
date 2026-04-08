import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSchedules } from "../../hooks/useSupabase";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Colors } from "../../constants/colors";
import { schedules as schedulesApi } from "../../lib/api";

const typeConfig: Record<string, { label: string; variant: "primary" | "neutral" | "warning" }> = {
  match: { label: "경기", variant: "primary" },
  training: { label: "훈련", variant: "neutral" },
  gathering: { label: "모임", variant: "warning" },
};

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { schedules, loading, refresh } = useSchedules();

  const upcoming = schedules
    .filter((s: any) => new Date(s.date) >= new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = schedules
    .filter((s: any) => new Date(s.date) < new Date())
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleVote = async (scheduleId: string, status: string) => {
    await schedulesApi.vote(scheduleId, status);
    refresh();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 24 }} showsVerticalScrollIndicator={false}>
        {/* Upcoming */}
        <View>
          <SectionHeader title="다가오는 일정" />
          {upcoming.length === 0 ? (
            <Card>
              <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", paddingVertical: 16 }}>다가오는 일정이 없습니다</Text>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {upcoming.map((s: any) => {
                const config = typeConfig[s.type] || typeConfig.match;
                const attendances = s.attendances || [];
                const attendingCount = attendances.filter((a: any) => a.status === "attending").length;
                const myAttendance = attendances.find((a: any) => a.users?.auth_id === user?.id || a.user_id === user?.id);

                return (
                  <Card key={s.id}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Badge label={config.label} variant={config.variant} />
                      <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{s.date} {s.time}</Text>
                    </View>
                    <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 4 }}>
                      {s.opponent ? `vs ${s.opponent}` : s.description || config.label}
                    </Text>
                    <Text style={{ fontSize: 13, color: Colors.gray[500], marginBottom: 12 }}>{s.location}</Text>

                    <View style={{ backgroundColor: Colors.gray[50], borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 14, color: Colors.gray[700] }}>참석 현황</Text>
                      <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.primary[500] }}>{attendingCount}명</Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {(["attending", "maybe", "not_attending"] as const).map((status) => {
                        const labels = { attending: "참석", maybe: "미정", not_attending: "불참" };
                        const isSelected = myAttendance?.status === status;
                        return (
                          <Pressable
                            key={status}
                            onPress={() => handleVote(s.id, status)}
                            style={{
                              flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center",
                              backgroundColor: isSelected ? Colors.primary[500] : Colors.gray[100],
                            }}
                          >
                            <Text style={{ fontSize: 14, fontWeight: "600", color: isSelected ? "#FFF" : Colors.gray[700] }}>
                              {labels[status]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        {/* Past */}
        {past.length > 0 && (
          <View>
            <SectionHeader title="지난 일정" />
            <View style={{ gap: 8 }}>
              {past.slice(0, 5).map((s: any) => {
                const config = typeConfig[s.type] || typeConfig.match;
                return (
                  <Card key={s.id}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Badge label={config.label} variant={config.variant} />
                      <Text style={{ flex: 1, fontSize: 14, color: Colors.gray[900] }}>
                        {s.opponent ? `vs ${s.opponent}` : s.description}
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{s.date}</Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/create-schedule/")}
        style={{
          position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
          backgroundColor: Colors.primary[500], alignItems: "center", justifyContent: "center",
          shadowColor: Colors.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}
