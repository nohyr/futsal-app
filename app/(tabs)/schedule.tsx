import { useState, useEffect } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSchedules, useTeam } from "../../hooks/useSupabase";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Colors } from "../../constants/colors";
import { schedules as schedulesApi } from "../../lib/api";
import { getWeatherForSchedule, getMapUrl, WeatherForecast } from "../../lib/weather";

const typeConfig: Record<string, { label: string; variant: "primary" | "neutral" | "warning" }> = {
  match: { label: "경기", variant: "primary" },
  training: { label: "훈련", variant: "neutral" },
  gathering: { label: "모임", variant: "warning" },
};

const voteLabels: Record<string, string> = {
  attending: "참석", maybe: "미정", not_attending: "불참", pending: "미응답",
};
const voteBadge: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  attending: "success", maybe: "warning", not_attending: "danger", pending: "neutral",
};

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { team } = useTeam();
  const { schedules, loading, refresh } = useSchedules();

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.users?.auth_id === user?.id || m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherForecast | null>>({});

  // 날씨 데이터 로드 (다가오는 일정만, 5일 이내)
  useEffect(() => {
    const loadWeather = async () => {
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
      const targetSchedules = schedules.filter((s: any) =>
        new Date(s.date) >= new Date() && new Date(s.date) <= fiveDaysLater
      );
      for (const s of targetSchedules) {
        if (!weatherCache[s.id]) {
          const weather = await getWeatherForSchedule(s.location, s.date, s.time);
          if (weather) setWeatherCache((prev) => ({ ...prev, [s.id]: weather }));
        }
      }
    };
    if (schedules.length > 0) loadWeather();
  }, [schedules]);

  const openMap = (location: string) => {
    const url = getMapUrl(location);
    Linking.openURL(url).catch(() => {});
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = schedules.filter((s: any) => s.date >= today).sort((a: any, b: any) => a.date.localeCompare(b.date));
  const past = schedules.filter((s: any) => s.date < today).sort((a: any, b: any) => b.date.localeCompare(a.date));

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
              <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", paddingVertical: 16 }}>
                다가오는 일정이 없습니다
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {upcoming.map((s: any) => {
                const config = typeConfig[s.type] || typeConfig.match;
                const attendances = s.attendances || [];
                const attendingCount = attendances.filter((a: any) => a.status === "attending").length;
                const maybeCount = attendances.filter((a: any) => a.status === "maybe").length;
                const notAttendingCount = attendances.filter((a: any) => a.status === "not_attending").length;
                const myAttendance = attendances.find((a: any) => a.user_id === user?.id);
                const isToday = s.date === today;
                const hasCheckedIn = attendances.some((a: any) => a.checked_in);

                return (
                  <Card key={s.id}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Badge label={config.label} variant={config.variant} />
                      {isToday && <Badge label="오늘" variant="danger" />}
                      <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{s.date} {s.time}</Text>
                    </View>

                    <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 4 }}>
                      {s.opponent ? `vs ${s.opponent}` : s.description || config.label}
                    </Text>
                    {/* 구장 + 길찾기 */}
                    <Pressable onPress={() => openMap(s.location)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      <Ionicons name="location" size={14} color={Colors.primary[500]} />
                      <Text style={{ fontSize: 13, color: Colors.primary[500], textDecorationLine: "underline" }}>{s.location}</Text>
                      <Ionicons name="navigate-outline" size={12} color={Colors.primary[500]} />
                    </Pressable>

                    {/* 날씨 */}
                    {weatherCache[s.id] && (
                      <View style={{
                        flexDirection: "row", alignItems: "center", gap: 8,
                        backgroundColor: weatherCache[s.id]!.isRainy ? Colors.danger[50] : Colors.primary[50],
                        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
                      }}>
                        <Text style={{ fontSize: 20 }}>{weatherCache[s.id]!.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.gray[900] }}>
                            {weatherCache[s.id]!.temp}° · {weatherCache[s.id]!.description}
                          </Text>
                          <Text style={{ fontSize: 12, color: Colors.gray[500] }}>
                            체감 {weatherCache[s.id]!.feelsLike}° · 강수 {Math.round(weatherCache[s.id]!.pop * 100)}% · 바람 {weatherCache[s.id]!.windSpeed}m/s
                          </Text>
                        </View>
                        {weatherCache[s.id]!.isRainy && (
                          <Badge label="우천 주의" variant="danger" />
                        )}
                      </View>
                    )}

                    {/* 참석 현황 상세 */}
                    <View style={{
                      flexDirection: "row", backgroundColor: Colors.gray[50], borderRadius: 8, padding: 12, marginBottom: 12, gap: 12,
                    }}>
                      <StatPill label="참석" count={attendingCount} color={Colors.success[500]} />
                      <StatPill label="미정" count={maybeCount} color={Colors.warning[500]} />
                      <StatPill label="불참" count={notAttendingCount} color={Colors.danger[500]} />
                    </View>

                    {/* 투표 버튼 */}
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                      {(["attending", "maybe", "not_attending"] as const).map((status) => {
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
                            <Text style={{
                              fontSize: 14, fontWeight: "600",
                              color: isSelected ? "#FFF" : Colors.gray[700],
                            }}>
                              {voteLabels[status]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* 참석 인원 목록 */}
                    {attendances.length > 0 && (
                      <View style={{ borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 12, gap: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 4 }}>
                          투표 현황 ({attendances.length}명)
                        </Text>
                        {attendances.map((a: any) => (
                          <View key={a.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Avatar name={a.users?.name || "?"} imageUrl={a.users?.profile_image} size={28} />
                              <Text style={{ fontSize: 14, color: Colors.gray[900] }}>{a.users?.name}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              {a.checked_in && (
                                <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
                              )}
                              {a.is_no_show && (
                                <Ionicons name="close-circle" size={16} color={Colors.danger[500]} />
                              )}
                              <Badge label={voteLabels[a.status] || "미응답"} variant={voteBadge[a.status] || "neutral"} />
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* 출석 체크 버튼 (admin + 당일) */}
                    {isAdmin && isToday && !hasCheckedIn && (
                      <Pressable
                        onPress={() => router.push(`/check-in/${s.id}`)}
                        style={{
                          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                          marginTop: 12, paddingVertical: 12, borderRadius: 8,
                          backgroundColor: Colors.warm[50], borderWidth: 1, borderColor: Colors.warm[400],
                        }}
                      >
                        <Ionicons name="checkbox-outline" size={18} color={Colors.warm[500]} />
                        <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.warm[500] }}>출석 체크하기</Text>
                      </Pressable>
                    )}

                    {/* 출석 체크 완료 표시 */}
                    {hasCheckedIn && (
                      <View style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                        marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.success[50],
                      }}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.success[500] }}>
                          출석 체크 완료 · {attendances.filter((a: any) => a.checked_in).length}명 출석
                          {attendances.some((a: any) => a.is_no_show) &&
                            ` · ${attendances.filter((a: any) => a.is_no_show).length}명 No-show`}
                        </Text>
                      </View>
                    )}
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
                const attendances = s.attendances || [];
                const checkedIn = attendances.filter((a: any) => a.checked_in).length;
                const noShow = attendances.filter((a: any) => a.is_no_show).length;

                return (
                  <Card key={s.id}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Badge label={config.label} variant={config.variant} />
                      <Text style={{ flex: 1, fontSize: 14, color: Colors.gray[900] }}>
                        {s.opponent ? `vs ${s.opponent}` : s.description}
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{s.date}</Text>
                    </View>
                    {(checkedIn > 0 || noShow > 0) && (
                      <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                        <Text style={{ fontSize: 12, color: Colors.success[500] }}>✓ 출석 {checkedIn}</Text>
                        {noShow > 0 && <Text style={{ fontSize: 12, color: Colors.danger[500] }}>✗ No-show {noShow}</Text>}
                      </View>
                    )}
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

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color }}>{count}</Text>
      <Text style={{ fontSize: 11, color: Colors.gray[500] }}>{label}</Text>
    </View>
  );
}
