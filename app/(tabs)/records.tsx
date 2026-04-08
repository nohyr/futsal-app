import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRecords, useTeam, useAttendanceStats } from "../../hooks/useSupabase";
import { Avatar } from "../../components/ui/Avatar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";

type TabKey = "archive" | "stats";

export default function RecordsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("archive");
  const { records, loading } = useRecords();
  const { team } = useTeam();
  const { stats: attendanceStats } = useAttendanceStats();

  const members = team?.team_members || [];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        {/* Tab Switcher */}
        <View style={{ flexDirection: "row", backgroundColor: Colors.gray[100], borderRadius: 12, padding: 4 }}>
          {([{ key: "archive" as TabKey, label: "활동 기록" }, { key: "stats" as TabKey, label: "팀 통계" }]).map((tab) => (
            <Pressable
              key={tab.key} onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center",
                backgroundColor: activeTab === tab.key ? Colors.gray[0] : "transparent",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: activeTab === tab.key ? Colors.gray[900] : Colors.gray[500] }}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "archive" ? (
          records.length === 0 ? (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Ionicons name="archive-outline" size={32} color={Colors.gray[300]} />
                <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>아직 기록이 없습니다</Text>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {records.map((record: any) => (
                <Card key={record.id}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Badge label={record.type === "match" ? "경기" : "훈련"} variant={record.type === "match" ? "primary" : "neutral"} />
                    <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{record.date}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>{record.title}</Text>
                    {record.our_score !== null && record.their_score !== null && (
                      <Text style={{
                        fontSize: 20, fontWeight: "700",
                        color: record.our_score > record.their_score ? Colors.primary[500] : record.our_score < record.their_score ? Colors.danger[500] : Colors.gray[500],
                      }}>
                        {record.our_score} - {record.their_score}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{record.location}</Text>
                  {record.memo && (
                    <View style={{ backgroundColor: Colors.warm[50], borderRadius: 8, padding: 10, marginTop: 8 }}>
                      <Text style={{ fontSize: 13, color: Colors.gray[700] }}>{record.memo}</Text>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          )
        ) : (
          <View style={{ gap: 20 }}>
            {/* Team Stats from members */}
            <Card>
              <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>{team?.name}</Text>
              <Text style={{ fontSize: 13, color: Colors.gray[500], marginBottom: 20 }}>멤버 {members.length}명</Text>
              {members.length > 0 && (
                <View>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 12 }}>개인 기록</Text>
                  {[...members].sort((a: any, b: any) => (b.goals || 0) - (a.goals || 0)).map((m: any, i: number) => (
                    <View key={m.id} style={{
                      flexDirection: "row", alignItems: "center", paddingVertical: 10,
                      borderBottomWidth: i < members.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
                    }}>
                      <Text style={{ width: 28, fontSize: 16, fontWeight: "700", color: i < 3 ? Colors.primary[500] : Colors.gray[500], textAlign: "center" }}>{i + 1}</Text>
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: Colors.gray[900], marginLeft: 12 }}>{m.users?.name || "멤버"}</Text>
                      <Text style={{ fontSize: 14, color: Colors.gray[500], marginRight: 12 }}>⚽ {m.goals || 0}</Text>
                      <Text style={{ fontSize: 14, color: Colors.gray[500] }}>🅰️ {m.assists || 0}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            {/* 출석률 랭킹 */}
            {attendanceStats.length > 0 && (
              <Card>
                <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 12 }}>출석률</Text>
                {[...attendanceStats]
                  .sort((a: any, b: any) => (b.attendance_rate || 0) - (a.attendance_rate || 0))
                  .map((stat: any, i: number) => (
                    <View key={stat.user_id} style={{
                      flexDirection: "row", alignItems: "center", paddingVertical: 10,
                      borderBottomWidth: i < attendanceStats.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
                    }}>
                      <Text style={{ width: 28, fontSize: 16, fontWeight: "700", color: i < 3 ? Colors.primary[500] : Colors.gray[500], textAlign: "center" }}>{i + 1}</Text>
                      <Avatar name={stat.user_name || "?"} imageUrl={stat.profile_image} size={32} style={{ marginLeft: 8 }} />
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: Colors.gray[900], marginLeft: 10 }}>{stat.user_name}</Text>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.primary[500] }}>{stat.attendance_rate}%</Text>
                        <Text style={{ fontSize: 11, color: Colors.gray[500] }}>{stat.attended}/{stat.total_events}</Text>
                      </View>
                    </View>
                  ))}
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/create-record/")}
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
