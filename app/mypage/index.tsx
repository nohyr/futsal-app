import { useEffect } from "react";
import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTeam, usePosts, useRecords, useAttendanceStats, useSchedules } from "../../hooks/useSupabase";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Colors } from "../../constants/colors";
import { formatRelativeTime } from "../../lib/utils";

export default function MyPageScreen() {
  const router = useRouter();
  const { user, signOut, teams } = useAuth();
  const { showToast } = useToast();
  const { team } = useTeam();
  const { posts } = usePosts();
  const { stats: attendanceStats } = useAttendanceStats();
  const { schedules } = useSchedules();

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";
  const myPosts = posts.filter((p: any) => p.author_id === user?.id);
  const myStat = attendanceStats.find((s: any) => s.user_id === user?.id);
  const mySchedules = schedules.filter((s: any) =>
    (s.attendances || []).some((a: any) => a.user_id === user?.id && (a.status === "attending" || a.checked_in))
  ).sort((a: any, b: any) => b.date.localeCompare(a.date));

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  const handleWithdraw = async () => {
    try {
      // 팀에서 탈퇴
      if (myMembership) {
        await supabase.from("team_members").delete().eq("id", myMembership.id);
      }
      // 로그아웃
      await signOut();
      showToast("탈퇴가 완료되었습니다", "success");
      router.replace("/auth/login");
    } catch (e) {
      showToast("탈퇴 처리 중 오류가 발생했습니다", "error");
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.gray[50] }} contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
      {/* 프로필 */}
      <Card>
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Avatar name={user?.name || "?"} imageUrl={user?.profileImage} size={64} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900] }}>{user?.name}</Text>
            {isAdmin && <Badge label="관리자" variant="primary" />}
          </View>
          <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 4 }}>{team?.name || "팀 없음"}</Text>
        </View>
      </Card>

      {/* 내 기록 */}
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

      {/* 내가 올린 게시글 */}
      {myPosts.length > 0 && (
        <View>
          <SectionHeader title="내가 올린 게시글" />
          <View style={{ gap: 6 }}>
            {myPosts.slice(0, 5).map((post: any) => (
              <Pressable key={post.id} onPress={() => router.push(`/post/${post.id}`)}>
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }} numberOfLines={1}>{post.title}</Text>
                      <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 2 }}>
                        {formatRelativeTime(post.created_at)} · 좋아요 {post.likes?.length || 0} · 댓글 {post.comments?.length || 0}
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

      {/* 참여한 일정 */}
      {mySchedules.length > 0 && (
        <View>
          <SectionHeader title="참여한 일정" />
          <View style={{ gap: 6 }}>
            {mySchedules.slice(0, 5).map((s: any) => {
              const myAtt = (s.attendances || []).find((a: any) => a.user_id === user?.id);
              return (
                <Card key={s.id}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Badge label={s.type === "match" ? "경기" : s.type === "training" ? "훈련" : "모임"} variant={s.type === "match" ? "primary" : "neutral"} />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: Colors.gray[900] }}>
                      {s.opponent ? `vs ${s.opponent}` : s.description || ""}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{s.date}</Text>
                    {myAtt?.checked_in && <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />}
                  </View>
                </Card>
              );
            })}
          </View>
          {mySchedules.length > 5 && (
            <Pressable onPress={() => router.push("/my-schedules/")} style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
              marginTop: 8, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.gray[100],
            }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary[500] }}>전체 {mySchedules.length}건 보기</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary[500]} />
            </Pressable>
          )}
        </View>
      )}

      {/* 메뉴 */}
      <Card>
        {/* 알림 설정 */}
        <Pressable onPress={() => router.push("/settings/notifications")} style={{
          flexDirection: "row", alignItems: "center", paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
        }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary[50], alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="notifications-outline" size={20} color={Colors.primary[500]} />
          </View>
          <Text style={{ flex: 1, fontSize: 15, color: Colors.gray[900], marginLeft: 12 }}>알림 설정</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
        </Pressable>

        {/* 팀 관리 */}
        <Pressable onPress={() => router.push("/team-manage/")} style={{
          flexDirection: "row", alignItems: "center", paddingVertical: 14,
        }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.warm[50], alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="shield-outline" size={20} color={Colors.warm[500]} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 15, color: Colors.gray[900] }}>팀 관리</Text>
          </View>
          {isAdmin && <Badge label="관리자" variant="primary" style={{ marginRight: 8 }} />}
          <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
        </Pressable>
      </Card>

      {/* 로그아웃 */}
      <Pressable onPress={() => setShowLogoutModal(true)} style={{ alignItems: "center", paddingVertical: 14 }}>
        <Text style={{ fontSize: 14, color: Colors.danger[500] }}>로그아웃</Text>
      </Pressable>

      {/* 탈퇴하기 */}
      <Pressable onPress={() => setShowWithdrawModal(true)} style={{ alignItems: "center", paddingVertical: 8, marginBottom: 20 }}>
        <Text style={{ fontSize: 13, color: Colors.gray[500], textDecorationLine: "underline" }}>탈퇴하기</Text>
      </Pressable>

      {/* 로그아웃 모달 */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={{
            width: 300, backgroundColor: Colors.gray[0], borderRadius: 16,
            paddingTop: 28, paddingBottom: 16, paddingHorizontal: 24,
          }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.danger[50], alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="log-out-outline" size={26} color={Colors.danger[500]} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 }}>로그아웃</Text>
              <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center" }}>정말 로그아웃 하시겠습니까?</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setShowLogoutModal(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: Colors.gray[100] }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[700] }}>취소</Text>
              </Pressable>
              <Pressable onPress={() => { setShowLogoutModal(false); handleLogout(); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: Colors.danger[500] }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}>로그아웃</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 탈퇴 모달 */}
      <Modal visible={showWithdrawModal} transparent animationType="fade" onRequestClose={() => setShowWithdrawModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }} onPress={() => setShowWithdrawModal(false)}>
          <Pressable style={{
            width: 320, backgroundColor: Colors.gray[0], borderRadius: 16,
            paddingTop: 28, paddingBottom: 16, paddingHorizontal: 24,
          }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.danger[50], alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="warning" size={26} color={Colors.danger[500]} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 }}>탈퇴하기</Text>
              <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", lineHeight: 20 }}>
                탈퇴하면 팀에서 제거되며,{"\n"}작성한 게시글과 댓글은 유지됩니다.{"\n"}이 작업은 되돌릴 수 없습니다.
              </Text>
            </View>

            {isAdmin && (
              <View style={{ backgroundColor: Colors.warning[50], borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Ionicons name="alert-circle" size={16} color={Colors.warning[500]} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.warning[500] }}>관리자 안내</Text>
                </View>
                <Text style={{ fontSize: 12, color: Colors.gray[700], lineHeight: 18 }}>
                  관리자 권한은 다른 팀원에게 먼저 위임해주세요. 관리자가 없으면 팀 운영이 어려울 수 있습니다.
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setShowWithdrawModal(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: Colors.gray[100] }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[700] }}>취소</Text>
              </Pressable>
              <Pressable onPress={() => { setShowWithdrawModal(false); handleWithdraw(); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: Colors.danger[500] }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}>탈퇴하기</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
