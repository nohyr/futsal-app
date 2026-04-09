import { useEffect } from "react";
import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useTeam, usePosts, useRecords, useAttendanceStats } from "../../hooks/useSupabase";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Colors } from "../../constants/colors";

export default function MyPageScreen() {
  const router = useRouter();
  const { user, signOut, teams } = useAuth();
  const { team } = useTeam();
  const { posts } = usePosts();
  const { records } = useRecords();
  const { stats: attendanceStats } = useAttendanceStats();

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.user_id === user?.id);
  const myPosts = posts.filter((p: any) => p.author_id === user?.id);
  const myStat = attendanceStats.find((s: any) => s.user_id === user?.id);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.gray[50] }} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
      {/* Profile */}
      <Card>
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Avatar name={user?.name || "?"} imageUrl={user?.profileImage} size={64} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900] }}>{user?.name}</Text>
            {myMembership?.role === "admin" && <Badge label="운영진" variant="primary" />}
          </View>
          <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 4 }}>
            {team?.name || "팀 없음"}
          </Text>
        </View>
      </Card>

      {/* Stats */}
      {myMembership && (
        <Card>
          <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 16 }}>내 기록</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 28, fontWeight: "700", color: Colors.primary[500] }}>{myMembership.goals || 0}</Text>
              <Text style={{ fontSize: 13, color: Colors.gray[500] }}>골</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 28, fontWeight: "700", color: Colors.warm[500] }}>{myMembership.assists || 0}</Text>
              <Text style={{ fontSize: 13, color: Colors.gray[500] }}>어시스트</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 28, fontWeight: "700", color: Colors.success[500] }}>
                {myStat ? `${myStat.attendance_rate}%` : "-"}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.gray[500] }}>출석률</Text>
            </View>
          </View>
        </Card>
      )}

      {/* My Posts */}
      {myPosts.length > 0 && (
        <View>
          <SectionHeader title="내가 올린 게시글" />
          <View style={{ gap: 8 }}>
            {myPosts.map((post: any) => (
              <Pressable key={post.id} onPress={() => router.push(`/post/${post.id}`)}>
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }} numberOfLines={1}>{post.title}</Text>
                      <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 2 }}>
                        {post.created_at?.slice(0, 10)} · 좋아요 {post.likes?.length || 0} · 댓글 {post.comments?.length || 0}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Menu */}
      <Card>
        {([
          { icon: "person-outline", label: "프로필 수정" },
          { icon: "notifications-outline", label: "알림 설정" },
          { icon: "shield-outline", label: "팀 관리", admin: true },
          { icon: "help-circle-outline", label: "도움말" },
        ] as { icon: string; label: string; admin?: boolean }[]).map((item, index) => (
          <Pressable key={item.label} style={{
            flexDirection: "row", alignItems: "center", paddingVertical: 14,
            borderBottomWidth: index < 3 ? 1 : 0, borderBottomColor: Colors.gray[100],
          }}>
            <Ionicons name={item.icon as any} size={22} color={Colors.gray[700]} />
            <Text style={{ flex: 1, fontSize: 15, color: Colors.gray[900], marginLeft: 12 }}>{item.label}</Text>
            {item.admin && <Badge label="관리자" variant="primary" style={{ marginRight: 8 }} />}
            <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
          </Pressable>
        ))}
      </Card>

      <Pressable onPress={() => setShowLogoutModal(true)} style={{ alignItems: "center", paddingVertical: 16 }}>
        <Text style={{ fontSize: 14, color: Colors.danger[500] }}>로그아웃</Text>
      </Pressable>

      {/* 로그아웃 확인 모달 */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable style={{
            width: 300, backgroundColor: Colors.gray[0], borderRadius: 16,
            paddingTop: 28, paddingBottom: 16, paddingHorizontal: 24,
            shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
          }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: Colors.danger[50], alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Ionicons name="log-out-outline" size={26} color={Colors.danger[500]} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 }}>
                로그아웃
              </Text>
              <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", lineHeight: 20 }}>
                정말 로그아웃 하시겠습니까?
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center",
                  backgroundColor: Colors.gray[100],
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[700] }}>취소</Text>
              </Pressable>
              <Pressable
                onPress={() => { setShowLogoutModal(false); handleLogout(); }}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center",
                  backgroundColor: Colors.danger[500],
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}>로그아웃</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
