import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { schedules as schedulesApi } from "../../lib/api";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Colors } from "../../constants/colors";

export default function CheckInScreen() {
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  const router = useRouter();
  const [schedule, setSchedule] = useState<any>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [scheduleId]);

  const loadSchedule = async () => {
    const { data } = await supabase
      .from("schedules")
      .select("*, attendances(*, users(*))")
      .eq("id", scheduleId)
      .single();

    if (data) {
      setSchedule(data);
      // 이미 출석 체크된 사람은 미리 체크
      const alreadyChecked = new Set<string>(
        (data.attendances || [])
          .filter((a: any) => a.checked_in)
          .map((a: any) => a.user_id as string)
      );
      setCheckedIds(alreadyChecked);
    }
    setLoading(false);
  };

  const toggleCheck = (userId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = (schedule?.attendances || []).map((a: any) => a.user_id);
    setCheckedIds(new Set(allIds));
  };

  const deselectAll = () => {
    setCheckedIds(new Set());
  };

  const handleSubmit = async () => {
    if (!schedule) return;
    setSubmitting(true);
    try {
      const allUserIds = (schedule.attendances || []).map((a: any) => a.user_id);
      await schedulesApi.bulkCheckIn(scheduleId!, Array.from(checkedIds), allUserIds);
      router.back();
    } catch (e) {
      console.error("check-in error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <Text style={{ fontSize: 16, color: Colors.gray[500] }}>일정을 찾을 수 없습니다</Text>
      </View>
    );
  }

  const attendances = schedule.attendances || [];
  const attendingMembers = attendances.filter((a: any) => a.status === "attending");
  const otherMembers = attendances.filter((a: any) => a.status !== "attending");

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
        backgroundColor: Colors.gray[0], borderBottomWidth: 1, borderBottomColor: Colors.gray[200],
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray[900]} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>출석 체크</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* Schedule Info */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Badge
              label={schedule.type === "match" ? "경기" : schedule.type === "training" ? "훈련" : "모임"}
              variant={schedule.type === "match" ? "primary" : "neutral"}
            />
            <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{schedule.date} {schedule.time}</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>
            {schedule.opponent ? `vs ${schedule.opponent}` : schedule.description || ""}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.gray[500], marginTop: 2 }}>{schedule.location}</Text>
        </Card>

        {/* Quick Actions */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={selectAll} style={{
            flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center",
            backgroundColor: Colors.primary[50],
          }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.primary[500] }}>전체 선택</Text>
          </Pressable>
          <Pressable onPress={deselectAll} style={{
            flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center",
            backgroundColor: Colors.gray[100],
          }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700] }}>전체 해제</Text>
          </Pressable>
        </View>

        {/* 참석 투표한 멤버 */}
        {attendingMembers.length > 0 && (
          <View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900], marginBottom: 8 }}>
              참석 투표 ({attendingMembers.length}명)
            </Text>
            <Card>
              {attendingMembers.map((a: any, i: number) => (
                <MemberCheckRow
                  key={a.id}
                  attendance={a}
                  isChecked={checkedIds.has(a.user_id)}
                  onToggle={() => toggleCheck(a.user_id)}
                  isLast={i === attendingMembers.length - 1}
                />
              ))}
            </Card>
          </View>
        )}

        {/* 기타 멤버 */}
        {otherMembers.length > 0 && (
          <View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900], marginBottom: 8 }}>
              기타 ({otherMembers.length}명)
            </Text>
            <Card>
              {otherMembers.map((a: any, i: number) => (
                <MemberCheckRow
                  key={a.id}
                  attendance={a}
                  isChecked={checkedIds.has(a.user_id)}
                  onToggle={() => toggleCheck(a.user_id)}
                  isLast={i === otherMembers.length - 1}
                />
              ))}
            </Card>
          </View>
        )}

        {attendances.length === 0 && (
          <Card>
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ fontSize: 14, color: Colors.gray[500] }}>아직 투표한 멤버가 없습니다</Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Submit */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
        backgroundColor: Colors.gray[0], borderTopWidth: 1, borderTopColor: Colors.gray[200],
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: Colors.gray[500] }}>
            출석: <Text style={{ fontWeight: "700", color: Colors.success[500] }}>{checkedIds.size}명</Text>
          </Text>
          <Text style={{ fontSize: 14, color: Colors.gray[500] }}>
            No-show: <Text style={{ fontWeight: "700", color: Colors.danger[500] }}>
              {attendances.length - checkedIds.size}명
            </Text>
          </Text>
        </View>
        <Button
          title={submitting ? "저장 중..." : "출석 체크 완료"}
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={submitting}
        />
      </View>
    </View>
  );
}

function MemberCheckRow({ attendance, isChecked, onToggle, isLast }: {
  attendance: any; isChecked: boolean; onToggle: () => void; isLast: boolean;
}) {
  const statusLabel: Record<string, string> = {
    attending: "참석", maybe: "미정", not_attending: "불참", pending: "미응답",
  };

  return (
    <Pressable
      onPress={onToggle}
      style={{
        flexDirection: "row", alignItems: "center", paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1, borderBottomColor: Colors.gray[100],
      }}
    >
      <Ionicons
        name={isChecked ? "checkbox" : "square-outline"}
        size={24}
        color={isChecked ? Colors.primary[500] : Colors.gray[300]}
      />
      <Avatar
        name={attendance.users?.name || "?"}
        imageUrl={attendance.users?.profile_image}
        size={32}
        style={{ marginLeft: 12 }}
      />
      <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: Colors.gray[900], marginLeft: 10 }}>
        {attendance.users?.name}
      </Text>
      <Badge
        label={statusLabel[attendance.status] || "미응답"}
        variant={attendance.status === "attending" ? "success" : attendance.status === "maybe" ? "warning" : "neutral"}
      />
    </Pressable>
  );
}
