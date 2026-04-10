import { useState, useEffect } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSchedules, useTeam } from "../../hooks/useSupabase";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Colors } from "../../constants/colors";
import { useToast } from "../../context/ToastContext";
import { schedules as schedulesApi } from "../../lib/api";
import { getWeatherForSchedule, getMapUrl, WeatherForecast } from "../../lib/weather";

const typeConfig: Record<string, { label: string; variant: "primary" | "neutral" | "warning"; color: string }> = {
  match: { label: "경기", variant: "primary", color: Colors.primary[500] },
  training: { label: "훈련", variant: "neutral", color: Colors.gray[500] },
  gathering: { label: "모임", variant: "warning", color: Colors.warm[500] },
};

const voteLabels: Record<string, string> = { attending: "참석", maybe: "미정", not_attending: "불참", pending: "미응답" };
const voteBadge: Record<string, "success" | "warning" | "danger" | "neutral"> = { attending: "success", maybe: "warning", not_attending: "danger", pending: "neutral" };

type ViewMode = "calendar" | "list";

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { team } = useTeam();
  const { schedules, loading, refresh } = useSchedules();

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.users?.auth_id === user?.id || m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherForecast | null>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 캘린더 상태
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth() + 1);

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
    Linking.openURL(getMapUrl(location)).catch(() => {});
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = schedules.filter((s: any) => s.date >= today).sort((a: any, b: any) => a.date.localeCompare(b.date));
  const past = schedules.filter((s: any) => s.date < today).sort((a: any, b: any) => b.date.localeCompare(a.date));

  const { showToast } = useToast();

  const handleVote = async (scheduleId: string, status: string) => {
    await schedulesApi.vote(scheduleId, status);
    refresh();
  };

  const handleRemind = async (scheduleId: string) => {
    const teamId = team?.id;
    if (!teamId) return;
    const count = await schedulesApi.sendVoteReminder(scheduleId, teamId);
    showToast(`미투표 ${count || 0}명에게 알림을 보냈습니다`, "success");
  };

  // 캘린더 계산
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // 날짜별 일정 매핑
  const schedulesByDate = new Map<string, any[]>();
  schedules.forEach((s: any) => {
    const key = s.date;
    if (!schedulesByDate.has(key)) schedulesByDate.set(key, []);
    schedulesByDate.get(key)!.push(s);
  });

  const prevMonth = () => { if (calMonth === 1) { setCalYear(calYear - 1); setCalMonth(12); } else setCalMonth(calMonth - 1); setSelectedDate(null); };
  const nextMonth = () => { if (calMonth === 12) { setCalYear(calYear + 1); setCalMonth(1); } else setCalMonth(calMonth + 1); setSelectedDate(null); };

  const selectedSchedules = selectedDate ? (schedulesByDate.get(selectedDate) || []) : [];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>

        {/* 뷰 모드 전환 */}
        <View style={{ flexDirection: "row", backgroundColor: Colors.gray[100], borderRadius: 12, padding: 4 }}>
          <Pressable onPress={() => setViewMode("calendar")} style={{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            paddingVertical: 8, borderRadius: 8,
            backgroundColor: viewMode === "calendar" ? Colors.gray[0] : "transparent",
          }}>
            <Ionicons name="calendar" size={16} color={viewMode === "calendar" ? Colors.primary[500] : Colors.gray[500]} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: viewMode === "calendar" ? Colors.primary[500] : Colors.gray[500] }}>캘린더</Text>
          </Pressable>
          <Pressable onPress={() => setViewMode("list")} style={{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            paddingVertical: 8, borderRadius: 8,
            backgroundColor: viewMode === "list" ? Colors.gray[0] : "transparent",
          }}>
            <Ionicons name="list" size={16} color={viewMode === "list" ? Colors.primary[500] : Colors.gray[500]} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: viewMode === "list" ? Colors.primary[500] : Colors.gray[500] }}>리스트</Text>
          </Pressable>
        </View>

        {/* ===== 1안: 캘린더 뷰 ===== */}
        {viewMode === "calendar" && (
          <>
            <Card>
              {/* 월 네비게이션 */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Pressable onPress={prevMonth} style={{ padding: 4 }}>
                  <Ionicons name="chevron-back" size={22} color={Colors.gray[700]} />
                </Pressable>
                <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.gray[900] }}>{calYear}년 {calMonth}월</Text>
                <Pressable onPress={nextMonth} style={{ padding: 4 }}>
                  <Ionicons name="chevron-forward" size={22} color={Colors.gray[700]} />
                </Pressable>
              </View>

              {/* 요일 헤더 */}
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                {dayNames.map((d, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: i === 0 ? Colors.danger[500] : i === 6 ? Colors.primary[500] : Colors.gray[500] }}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* 날짜 그리드 */}
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {calendarDays.map((day, i) => {
                  if (day === null) return <View key={i} style={{ width: "14.28%", height: 56 }} />;
                  const dateKey = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const daySchedules = schedulesByDate.get(dateKey) || [];
                  const isToday = dateKey === today;
                  const isSelected = dateKey === selectedDate;
                  const dow = i % 7;

                  return (
                    <Pressable key={i} onPress={() => setSelectedDate(isSelected ? null : dateKey)} style={{ width: "14.28%", alignItems: "center", paddingVertical: 4 }}>
                      <View style={[
                        { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
                        isSelected && { backgroundColor: Colors.primary[500] },
                        isToday && !isSelected && { borderWidth: 2, borderColor: Colors.primary[500] },
                      ]}>
                        <Text style={{
                          fontSize: 15, fontWeight: isToday || isSelected ? "700" : "400",
                          color: isSelected ? "#FFF" : dow === 0 ? Colors.danger[500] : dow === 6 ? Colors.primary[500] : Colors.gray[900],
                        }}>{day}</Text>
                      </View>
                      {/* 일정 도트 */}
                      <View style={{ flexDirection: "row", gap: 2, marginTop: 2, height: 6 }}>
                        {daySchedules.slice(0, 3).map((s: any) => (
                          <View key={s.id} style={{
                            width: 5, height: 5, borderRadius: 3,
                            backgroundColor: typeConfig[s.type]?.color || Colors.primary[500],
                          }} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* 범례 */}
              <View style={{ flexDirection: "row", gap: 16, marginTop: 12, justifyContent: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary[500] }} />
                  <Text style={{ fontSize: 11, color: Colors.gray[500] }}>경기</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gray[500] }} />
                  <Text style={{ fontSize: 11, color: Colors.gray[500] }}>훈련</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.warm[500] }} />
                  <Text style={{ fontSize: 11, color: Colors.gray[500] }}>모임</Text>
                </View>
              </View>
            </Card>

            {/* 선택한 날짜의 일정 */}
            {selectedDate && (
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 }}>
                  {selectedDate.replace(/-/g, ".")} 일정
                </Text>
                {selectedSchedules.length === 0 ? (
                  <Card>
                    <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", paddingVertical: 12 }}>이 날짜에 일정이 없습니다</Text>
                  </Card>
                ) : (
                  <View style={{ gap: 10 }}>
                    {selectedSchedules.map((s: any) => (
                      <ScheduleCard key={s.id} schedule={s} user={user} isAdmin={isAdmin} weatherCache={weatherCache} onVote={handleVote} onRemind={handleRemind} onMap={openMap} router={router} team={team} />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 선택 안 했을 때 다가오는 일정 미니 리스트 */}
            {!selectedDate && upcoming.length > 0 && (
              <View>
                <SectionHeader title="다가오는 일정" />
                <View style={{ gap: 8 }}>
                  {upcoming.slice(0, 3).map((s: any) => {
                    const config = typeConfig[s.type] || typeConfig.match;
                    const attendingCount = (s.attendances || []).filter((a: any) => a.status === "attending").length;
                    return (
                      <Pressable key={s.id} onPress={() => {
                        const d = new Date(s.date);
                        setCalYear(d.getFullYear());
                        setCalMonth(d.getMonth() + 1);
                        setSelectedDate(s.date);
                      }}>
                        <Card>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{ width: 4, height: 40, borderRadius: 2, backgroundColor: config.color, marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                <Badge label={config.label} variant={config.variant} />
                                <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{s.date} {s.time}</Text>
                              </View>
                              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>
                                {s.opponent ? `vs ${s.opponent}` : s.description || config.label}
                              </Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                              <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.primary[500] }}>{attendingCount}</Text>
                              <Text style={{ fontSize: 10, color: Colors.gray[500] }}>참석</Text>
                            </View>
                          </View>
                        </Card>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* ===== 2안: 리스트 뷰 ===== */}
        {viewMode === "list" && (
          <>
            <View>
              <SectionHeader title="다가오는 일정" />
              {upcoming.length === 0 ? (
                <Card>
                  <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", paddingVertical: 16 }}>다가오는 일정이 없습니다</Text>
                </Card>
              ) : (
                <View style={{ gap: 12 }}>
                  {upcoming.map((s: any) => (
                    <ScheduleCard key={s.id} schedule={s} user={user} isAdmin={isAdmin} weatherCache={weatherCache} onVote={handleVote} onRemind={handleRemind} onMap={openMap} router={router} team={team} />
                  ))}
                </View>
              )}
            </View>

            {past.length > 0 && (
              <View>
                <SectionHeader title="지난 일정" />
                <View style={{ gap: 8 }}>
                  {past.slice(0, 5).map((s: any) => {
                    const config = typeConfig[s.type] || typeConfig.match;
                    const checkedIn = (s.attendances || []).filter((a: any) => a.checked_in).length;
                    const noShow = (s.attendances || []).filter((a: any) => a.is_no_show).length;
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
          </>
        )}
      </ScrollView>

      {isAdmin && <Pressable
        onPress={() => router.push("/create-schedule/")}
        style={{
          position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
          backgroundColor: Colors.primary[500], alignItems: "center", justifyContent: "center",
          shadowColor: Colors.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>}
    </View>
  );
}

// 투표 시간 포맷
function formatVoteTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${h}:${min}`;
}

// 일정 상세 카드 (공통 사용)
function ScheduleCard({ schedule: s, user, isAdmin, weatherCache, onVote, onMap, onRemind, router, team }: any) {
  const config = typeConfig[s.type] || typeConfig.match;
  const attendances = s.attendances || [];
  const attendingCount = attendances.filter((a: any) => a.status === "attending").length;
  const maybeCount = attendances.filter((a: any) => a.status === "maybe").length;
  const notAttendingCount = attendances.filter((a: any) => a.status === "not_attending").length;
  const myAttendance = attendances.find((a: any) => a.user_id === user?.id);
  const isToday = s.date === new Date().toISOString().slice(0, 10);
  const hasCheckedIn = attendances.some((a: any) => a.checked_in);

  // 미투표 멤버 계산
  const allMembers = team?.team_members || [];
  const votedUserIds = new Set(attendances.map((a: any) => a.user_id));
  const notVotedMembers = allMembers.filter((m: any) => !votedUserIds.has(m.user_id));

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Badge label={config.label} variant={config.variant} />
        {isToday && <Badge label="오늘" variant="danger" />}
        <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{s.date} {s.time}</Text>
      </View>

      <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 4 }}>
        {s.opponent ? `vs ${s.opponent}` : s.description || config.label}
      </Text>

      <Pressable onPress={() => onMap(s.location)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
        <Ionicons name="location" size={14} color={Colors.primary[500]} />
        <Text style={{ fontSize: 13, color: Colors.primary[500], textDecorationLine: "underline" }}>{s.location}</Text>
      </Pressable>

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
              체감 {weatherCache[s.id]!.feelsLike}° · 강수 {Math.round(weatherCache[s.id]!.pop * 100)}%
            </Text>
          </View>
          {weatherCache[s.id]!.isRainy && <Badge label="우천 주의" variant="danger" />}
        </View>
      )}

      <View style={{ flexDirection: "row", backgroundColor: Colors.gray[50], borderRadius: 8, padding: 12, marginBottom: 12, gap: 12 }}>
        <StatPill label="참석" count={attendingCount} color={Colors.success[500]} />
        <StatPill label="미정" count={maybeCount} color={Colors.warning[500]} />
        <StatPill label="불참" count={notAttendingCount} color={Colors.danger[500]} />
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {(["attending", "maybe", "not_attending"] as const).map((status) => {
          const isSelected = myAttendance?.status === status;
          return (
            <Pressable key={status} onPress={() => onVote(s.id, status)} style={{
              flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center",
              backgroundColor: isSelected ? Colors.primary[500] : Colors.gray[100],
            }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: isSelected ? "#FFF" : Colors.gray[700] }}>
                {voteLabels[status]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <VoteSection attendances={attendances} notVotedMembers={notVotedMembers} allMembers={allMembers} />

      {/* 미투표자 알림 버튼 (admin + 미투표자 있을 때) — 매일 자동 알림 확인 후 활성화 예정
      {isAdmin && notVotedMembers.length > 0 && (
        <Pressable onPress={() => onRemind(s.id)} style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          marginTop: 12, paddingVertical: 10, borderRadius: 8,
          backgroundColor: Colors.warning[50], borderWidth: 1, borderColor: Colors.warning[500],
        }}>
          <Ionicons name="notifications-outline" size={16} color={Colors.warning[500]} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.warning[500] }}>
            미투표 {notVotedMembers.length}명에게 알림 보내기
          </Text>
        </Pressable>
      )}
      */}

      {isAdmin && isToday && !hasCheckedIn && (
        <Pressable onPress={() => router.push(`/check-in/${s.id}`)} style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          marginTop: 12, paddingVertical: 12, borderRadius: 8,
          backgroundColor: Colors.warm[50], borderWidth: 1, borderColor: Colors.warm[400],
        }}>
          <Ionicons name="checkbox-outline" size={18} color={Colors.warm[500]} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.warm[500] }}>출석 체크하기</Text>
        </Pressable>
      )}

      {hasCheckedIn && (
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.success[50],
        }}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.success[500] }}>
            출석 체크 완료 · {attendances.filter((a: any) => a.checked_in).length}명 출석
          </Text>
        </View>
      )}
    </Card>
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

// 투표 현황 섹션 (접기/펼치기)
function VoteSection({ attendances, notVotedMembers, allMembers }: { attendances: any[]; notVotedMembers: any[]; allMembers: any[] }) {
  const [expanded, setExpanded] = useState<"attending" | "maybe" | "not_attending" | "notvoted" | null>(null);

  if (allMembers.length === 0) return null;

  const attending = attendances.filter((a: any) => a.status === "attending");
  const maybe = attendances.filter((a: any) => a.status === "maybe");
  const notAttending = attendances.filter((a: any) => a.status === "not_attending");

  const groups = [
    { key: "attending" as const, label: "참석", list: attending, color: Colors.success[500], bg: Colors.success[50], icon: "checkmark-circle" },
    { key: "maybe" as const, label: "미정", list: maybe, color: Colors.warning[500], bg: Colors.warning[50], icon: "help-circle" },
    { key: "not_attending" as const, label: "불참", list: notAttending, color: Colors.danger[500], bg: Colors.danger[50], icon: "close-circle" },
    { key: "notvoted" as const, label: "미투표", list: notVotedMembers, color: Colors.gray[500], bg: Colors.gray[100], icon: "alert-circle" },
  ];

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 12, gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 4 }}>
        투표 현황 ({attendances.length}/{allMembers.length}명)
      </Text>

      {/* 요약 버튼 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {groups.map((g) => {
          if (g.list.length === 0) return null;
          const isOpen = expanded === g.key;
          return (
            <Pressable
              key={g.key}
              onPress={() => setExpanded(isOpen ? null : g.key)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
                backgroundColor: isOpen ? g.color : g.bg,
              }}
            >
              <Ionicons name={g.icon as any} size={14} color={isOpen ? "#FFF" : g.color} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: isOpen ? "#FFF" : g.color }}>
                {g.label} {g.list.length}
              </Text>
              <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={12} color={isOpen ? "#FFF" : g.color} />
            </Pressable>
          );
        })}
      </View>

      {/* 펼쳐진 목록 */}
      {expanded && (() => {
        const group = groups.find((g) => g.key === expanded);
        if (!group || group.list.length === 0) return null;

        return (
          <View style={{ backgroundColor: group.bg, borderRadius: 10, padding: 10, marginTop: 4 }}>
            {group.key === "notvoted" ? (
              // 미투표 멤버
              group.list.map((m: any) => (
                <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 }}>
                  <Avatar name={m.users?.name || "?"} imageUrl={m.users?.profile_image} size={26} />
                  <Text style={{ fontSize: 13, color: Colors.gray[700] }}>{m.users?.name}</Text>
                </View>
              ))
            ) : (
              // 투표한 멤버
              group.list.map((a: any) => (
                <View key={a.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 5 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Avatar name={a.users?.name || "?"} imageUrl={a.users?.profile_image} size={26} />
                    <View>
                      <Text style={{ fontSize: 13, color: Colors.gray[900] }}>{a.users?.name}</Text>
                      {a.updated_at && (
                        <Text style={{ fontSize: 10, color: Colors.gray[500] }}>{formatVoteTime(a.updated_at)}</Text>
                      )}
                    </View>
                  </View>
                  {a.checked_in && <Ionicons name="checkmark-circle" size={14} color={Colors.success[500]} />}
                  {a.is_no_show && <Ionicons name="close-circle" size={14} color={Colors.danger[500]} />}
                </View>
              ))
            )}
          </View>
        );
      })()}
    </View>
  );
}
