import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNotices, useTeam } from "../../hooks/useSupabase";
import { useAuth } from "../../context/AuthContext";
import { notices as noticesApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Colors } from "../../constants/colors";
import { formatRelativeTime } from "../../lib/utils";

const categoryConfig: Record<string, { label: string; variant: "primary" | "success" | "warning" | "danger" | "neutral" }> = {
  general: { label: "전체", variant: "neutral" },
  schedule: { label: "일정", variant: "primary" },
  location: { label: "장소", variant: "success" },
  fee: { label: "회비", variant: "warning" },
  uniform: { label: "유니폼", variant: "danger" },
  newmember: { label: "신규팀원", variant: "primary" },
};

type FilterKey = "all" | "general" | "schedule" | "location" | "fee" | "uniform" | "newmember";

export default function NoticeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { team } = useTeam();
  const { notices, loading, refresh } = useNotices();
  const [filter, setFilter] = useState<FilterKey>("all");

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.users?.auth_id === user?.id || m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";

  // 읽음 현황 모달
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [readStats, setReadStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleReadStats = async (notice: any) => {
    setSelectedNotice(notice);
    setStatsLoading(true);
    try {
      const stats = await noticesApi.getReadStats(notice.id);
      setReadStats(stats);
    } catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  };

  const pinned = notices.filter((n: any) => n.is_pinned);
  const filtered = filter === "all" ? notices : notices.filter((n: any) => n.category === filter);
  const unpinned = filtered.filter((n: any) => !n.is_pinned);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16, gap: 8 }} showsVerticalScrollIndicator={false}>

        {/* 카테고리 필터 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6, marginBottom: 8 }}>
          {([{ key: "all" as FilterKey, label: "전체" }, ...Object.entries(categoryConfig).map(([key, cfg]) => ({ key: key as FilterKey, label: cfg.label }))]).map((f) => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
              backgroundColor: filter === f.key ? Colors.primary[500] : Colors.gray[100],
            }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: filter === f.key ? "#FFF" : Colors.gray[700] }}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 고정 공지 (필터 무관하게 항상 표시) */}
        {filter === "all" && pinned.length > 0 && (
          <View style={{ paddingHorizontal: 20, gap: 6 }}>
            {pinned.map((notice: any) => (
              <Pressable key={notice.id} onPress={() => router.push(`/notice/${notice.id}`)}>
                <Card variant="warm">
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="pin" size={13} color={Colors.warm[500]} />
                    <Badge label={categoryConfig[notice.category]?.label || "전체"} variant={categoryConfig[notice.category]?.variant || "neutral"} />
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: Colors.gray[900] }} numberOfLines={1}>{notice.title}</Text>
                    {!notice.is_read && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.danger[500] }} />}
                  </View>
                  <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 4 }}>{formatRelativeTime(notice.created_at)}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {/* 일반 공지 목록 */}
        <View style={{ paddingHorizontal: 20, gap: 6 }}>
          {notices.length === 0 ? (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Ionicons name="megaphone-outline" size={32} color={Colors.gray[300]} />
                <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>아직 공지가 없습니다</Text>
              </View>
            </Card>
          ) : unpinned.length === 0 && filter !== "all" ? (
            <Card>
              <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", paddingVertical: 16 }}>해당 카테고리 공지가 없습니다</Text>
            </Card>
          ) : (
            unpinned.map((notice: any) => {
              const config = categoryConfig[notice.category] || categoryConfig.general;
              return (
                <Pressable key={notice.id} onPress={() => router.push(`/notice/${notice.id}`)}>
                  <Card>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Badge label={config.label} variant={config.variant} />
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: Colors.gray[900] }} numberOfLines={1}>{notice.title}</Text>
                      {!notice.is_read && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.danger[500] }} />}
                      {isAdmin && (
                        <Pressable onPress={(e) => { e.stopPropagation(); handleReadStats(notice); }} hitSlop={8}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                            <Ionicons name="eye-outline" size={13} color={Colors.gray[500]} />
                            <Text style={{ fontSize: 11, color: Colors.gray[500] }}>{notice.read_count || 0}</Text>
                          </View>
                        </Pressable>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 4 }}>{formatRelativeTime(notice.created_at)}</Text>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {isAdmin && (
        <Pressable onPress={() => router.push("/create-notice/")} style={{
          position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
          backgroundColor: Colors.primary[500], alignItems: "center", justifyContent: "center",
          shadowColor: Colors.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
        }}>
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      )}

      {/* 읽음 현황 모달 */}
      <Modal visible={!!selectedNotice} transparent animationType="slide" onRequestClose={() => setSelectedNotice(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setSelectedNotice(null)}>
          <View style={{ flex: 1 }} />
          <Pressable style={{ backgroundColor: Colors.gray[0], borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: "60%" }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>읽음 현황</Text>
            <Text style={{ fontSize: 14, color: Colors.gray[500], marginBottom: 16 }} numberOfLines={1}>{selectedNotice?.title}</Text>
            {statsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} style={{ paddingVertical: 20 }} />
            ) : readStats ? (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: Colors.gray[700] }}>{readStats.read_count}/{readStats.total_members}명 읽음</Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.primary[500] }}>{readStats.read_rate}%</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.gray[100], marginBottom: 20, overflow: "hidden" }}>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.primary[500], width: `${readStats.read_rate}%` }} />
                </View>
                {readStats.unread_users?.length > 0 ? (
                  <>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.danger[500], marginBottom: 10 }}>읽지 않은 팀원 ({readStats.unread_users.length}명)</Text>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {readStats.unread_users.map((u: any) => (
                        <View key={u.user_id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
                          <Avatar name={u.name || "?"} imageUrl={u.profile_image} size={32} />
                          <Text style={{ fontSize: 14, color: Colors.gray[900] }}>{u.name}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                ) : (
                  <View style={{ alignItems: "center", paddingVertical: 16 }}>
                    <Ionicons name="checkmark-circle" size={32} color={Colors.success[500]} />
                    <Text style={{ fontSize: 14, color: Colors.success[500], marginTop: 8 }}>모든 팀원이 읽었습니다</Text>
                  </View>
                )}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
