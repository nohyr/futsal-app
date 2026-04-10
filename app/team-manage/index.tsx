import { useState } from "react";
import { ScrollView, View, Text, Pressable, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../../context/AuthContext";
import { useTeam } from "../../hooks/useSupabase";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";

export default function TeamManageScreen() {
  const { user } = useAuth();
  const { team, refresh } = useTeam();
  const { showToast } = useToast();

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";

  const [editingTeam, setEditingTeam] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editGround, setEditGround] = useState("");

  const copyInviteCode = async () => {
    if (!team?.invite_code) return;
    await Clipboard.setStringAsync(team.invite_code);
    showToast("초대 코드가 복사되었습니다", "success");
  };

  const startEditTeam = () => {
    setEditName(team?.name || "");
    setEditDesc(team?.description || "");
    setEditGround(team?.home_ground || "");
    setEditingTeam(true);
  };

  const saveTeamEdit = async () => {
    await supabase.from("teams").update({
      name: editName, description: editDesc, home_ground: editGround,
    }).eq("id", team?.id);
    setEditingTeam(false);
    refresh();
    showToast("팀 정보가 수정되었습니다", "success");
  };

  const toggleMemberRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    await supabase.from("team_members").update({ role: newRole }).eq("id", memberId);
    refresh();
    showToast(newRole === "admin" ? "관리자로 변경되었습니다" : "일반 멤버로 변경되었습니다", "success");
  };

  const removeMember = async (memberId: string, memberName: string) => {
    await supabase.from("team_members").delete().eq("id", memberId);
    refresh();
    showToast(`${memberName}님이 팀에서 제거되었습니다`, "success");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.gray[50] }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      {/* 팀 정보 */}
      <Card>
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Image source={require("../../assets/defe-spirit-logo.png")} style={{ width: 64, height: 64, marginBottom: 12 }} resizeMode="contain" />
          {editingTeam ? (
            <View style={{ width: "100%", gap: 10 }}>
              <TextInput value={editName} onChangeText={setEditName} placeholder="팀 이름"
                style={{ backgroundColor: Colors.gray[50], borderRadius: 10, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: Colors.gray[900], textAlign: "center" }}
              />
              <TextInput value={editDesc} onChangeText={setEditDesc} placeholder="팀 소개" multiline
                style={{ backgroundColor: Colors.gray[50], borderRadius: 10, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.gray[900], minHeight: 60, textAlignVertical: "top" }}
              />
              <TextInput value={editGround} onChangeText={setEditGround} placeholder="홈 구장"
                style={{ backgroundColor: Colors.gray[50], borderRadius: 10, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.gray[900] }}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <Pressable onPress={() => setEditingTeam(false)} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", backgroundColor: Colors.gray[100] }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.gray[700] }}>취소</Text>
                </Pressable>
                <Pressable onPress={saveTeamEdit} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", backgroundColor: Colors.primary[500] }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFF" }}>저장</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 22, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>{team?.name}</Text>
              <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", marginBottom: 4 }}>{team?.description}</Text>
              {team?.home_ground && <Text style={{ fontSize: 13, color: Colors.gray[500] }}>🏟️ {team.home_ground}</Text>}
              <Text style={{ fontSize: 13, color: Colors.gray[500], marginTop: 2 }}>창단 {team?.founded_date?.slice(0, 4)}년 · 멤버 {members.length}명</Text>
              {isAdmin && (
                <Pressable onPress={startEditTeam} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.gray[100] }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700] }}>팀 정보 수정</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </Card>

      {/* 초대 코드 */}
      <Pressable onPress={copyInviteCode}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 13, color: Colors.gray[500], marginBottom: 4 }}>초대 코드</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.primary[500], letterSpacing: 2 }}>{team?.invite_code}</Text>
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[50], alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="copy-outline" size={20} color={Colors.primary[500]} />
            </View>
          </View>
        </Card>
      </Pressable>

      {/* 팀원 목록 */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.gray[900], marginBottom: 10 }}>팀원 ({members.length}명)</Text>
        <Card>
          {members.map((m: any, index: number) => (
            <View key={m.id} style={{
              flexDirection: "row", alignItems: "center", paddingVertical: 12,
              borderBottomWidth: index < members.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
            }}>
              <Avatar name={m.users?.name || "?"} imageUrl={m.users?.profile_image} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>{m.users?.name}</Text>
                  {m.role === "admin" && <Badge label="관리자" variant="primary" />}
                </View>
                <Text style={{ fontSize: 12, color: Colors.gray[500] }}>#{m.number || 0} {m.position === "GK" ? "골키퍼" : "필드"}</Text>
              </View>

              {/* admin: 역할 변경 + 내보내기 (본인 제외) */}
              {isAdmin && m.user_id !== user?.id && (
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Pressable onPress={() => toggleMemberRole(m.id, m.role)} style={{
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.gray[100],
                  }}>
                    <Text style={{ fontSize: 11, color: Colors.gray[700] }}>{m.role === "admin" ? "일반" : "관리자"}</Text>
                  </Pressable>
                  <Pressable onPress={() => removeMember(m.id, m.users?.name)} style={{
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.danger[50],
                  }}>
                    <Text style={{ fontSize: 11, color: Colors.danger[500] }}>내보내기</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
