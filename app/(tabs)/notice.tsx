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
  const { notices, loading, refresh } = useNotices();

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.users?.auth_id === user?.id || m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";

  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [readStats, setReadStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const pinned = notices.filter((n: any) => n.is_pinned);
  const others = notices.filter((n: any) => !n.is_pinned);

  const handleNoticePress = async (notice: any) => {
    // 읽음 처리
    if (!notice.is_read) {
      await noticesApi.markAsRead(notice.id);
      refresh();
    }
  };

  const handleReadStats = async (notice: any) => {
    setSelectedNotice(notice);
    setStatsLoading(true);
    try {
      const stats = await noticesApi.getReadStats(notice.id);
      setReadStats(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
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
            {pinned.map((notice: any) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isPinned
                isAdmin={isAdmin}
                onPress={() => handleNoticePress(notice)}
                onReadStats={() => handleReadStats(notice)}
              />
            ))}
            {others.map((notice: any) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isPinned={false}
                isAdmin={isAdmin}
                onPress={() => handleNoticePress(notice)}
                onReadStats={() => handleReadStats(notice)}
              />
            ))}
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

      {/* 읽음 현황 모달 (관리자용) */}
      <Modal visible={!!selectedNotice} transparent animationType="slide" onRequestClose={() => setSelectedNotice(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setSelectedNotice(null)}>
          <View style={{ flex: 1 }} />
          <Pressable style={{
            backgroundColor: Colors.gray[0], borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: "60%",
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 16 }} />

            <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>
              읽음 현황
            </Text>
            <Text style={{ fontSize: 14, color: Colors.gray[500], marginBottom: 16 }} numberOfLines={1}>
              {selectedNotice?.title}
            </Text>

            {statsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} style={{ paddingVertical: 20 }} />
            ) : readStats ? (
              <>
                {/* 읽음률 바 */}
                <View style={{
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 14, color: Colors.gray[700] }}>
                    {readStats.read_count}/{readStats.total_members}명 읽음
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.primary[500] }}>
                    {readStats.read_rate}%
                  </Text>
                </View>
                <View style={{
                  height: 8, borderRadius: 4, backgroundColor: Colors.gray[100], marginBottom: 20, overflow: "hidden",
                }}>
                  <View style={{
                    height: 8, borderRadius: 4, backgroundColor: Colors.primary[500],
                    width: `${readStats.read_rate}%`,
                  }} />
                </View>

                {/* 미읽음 멤버 목록 */}
                {readStats.unread_users?.length > 0 && (
                  <>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.danger[500], marginBottom: 10 }}>
                      읽지 않은 팀원 ({readStats.unread_users.length}명)
                    </Text>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {readStats.unread_users.map((u: any) => (
                        <View key={u.user_id} style={{
                          flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8,
                        }}>
                          <Avatar name={u.name || "?"} imageUrl={u.profile_image} size={32} />
                          <Text style={{ fontSize: 14, color: Colors.gray[900] }}>{u.name}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}

                {readStats.unread_users?.length === 0 && (
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

function NoticeCard({ notice, isPinned, isAdmin, onPress, onReadStats }: {
  notice: any; isPinned: boolean; isAdmin: boolean; onPress: () => void; onReadStats: () => void;
}) {
  const config = categoryConfig[notice.category] || categoryConfig.general;
  const totalMembers = notice.read_count !== undefined ? notice.read_count : 0;

  return (
    <Pressable onPress={onPress}>
      <Card variant={isPinned ? "warm" : "default"}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {isPinned && <Ionicons name="pin" size={14} color={Colors.warm[500]} />}
          <Badge label={config.label} variant={config.variant} />
          <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{notice.created_at?.slice(0, 10)}</Text>

          {/* 미읽음 표시 */}
          {!notice.is_read && (
            <View style={{
              width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger[500],
            }} />
          )}

          <View style={{ flex: 1 }} />

          {/* 관리자: 읽음 현황 버튼 */}
          {isAdmin && (
            <Pressable onPress={onReadStats} hitSlop={8}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Ionicons name="eye-outline" size={14} color={Colors.gray[500]} />
                <Text style={{ fontSize: 11, color: Colors.gray[500] }}>{notice.read_count || 0}</Text>
              </View>
            </Pressable>
          )}
        </View>

        <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 6 }}>
          {notice.title}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.gray[700] }} numberOfLines={2}>
          {notice.content}
        </Text>
      </Card>
    </Pressable>
  );
}
