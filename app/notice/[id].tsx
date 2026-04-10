import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, Switch } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTeam } from "../../hooks/useSupabase";
import { supabase } from "../../lib/supabase";
import { notices as noticesApi } from "../../lib/api";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Colors } from "../../constants/colors";
import { formatFullDateTime } from "../../lib/utils";

const categoryConfig: Record<string, { label: string; variant: "primary" | "success" | "warning" | "danger" | "neutral" }> = {
  general: { label: "전체", variant: "neutral" },
  schedule: { label: "일정", variant: "primary" },
  location: { label: "장소", variant: "success" },
  fee: { label: "회비", variant: "warning" },
  uniform: { label: "유니폼", variant: "danger" },
  newmember: { label: "신규팀원", variant: "primary" },
};

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { team } = useTeam();
  const { showToast } = useToast();

  const [notice, setNotice] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editPinned, setEditPinned] = useState(false);

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";

  useEffect(() => { loadNotice(); }, [id]);

  const loadNotice = async () => {
    const { data } = await supabase.from("notices").select("*").eq("id", id).single();
    if (data) {
      setNotice(data);
      // 작성자 정보 로드
      const { data: authorData } = await supabase.from("users").select("name, profile_image").eq("id", data.author_id).single();
      setAuthor(authorData);
      // 읽음 처리
      await noticesApi.markAsRead(data.id);
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setEditTitle(notice.title);
    setEditContent(notice.content);
    setEditCategory(notice.category);
    setEditPinned(notice.is_pinned);
    setEditing(true);
    setShowMenu(false);
  };

  const saveEdit = async () => {
    await noticesApi.update(id!, { title: editTitle, content: editContent, category: editCategory, is_pinned: editPinned });
    setNotice((prev: any) => ({ ...prev, title: editTitle, content: editContent, category: editCategory, is_pinned: editPinned }));
    setEditing(false);
    showToast("공지가 수정되었습니다", "success");
  };

  const handleDelete = async () => {
    setShowMenu(false);
    await noticesApi.delete(id!);
    showToast("공지가 삭제되었습니다", "success");
    setTimeout(() => router.back(), 300);
  };

  const togglePin = async () => {
    const newPinned = !notice.is_pinned;
    await noticesApi.update(id!, { is_pinned: newPinned });
    setNotice((prev: any) => ({ ...prev, is_pinned: newPinned }));
    setShowMenu(false);
    showToast(newPinned ? "상단에 고정되었습니다" : "고정이 해제되었습니다", "success");
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>;
  }
  if (!notice) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}><Text style={{ fontSize: 16, color: Colors.gray[500] }}>공지를 찾을 수 없습니다</Text></View>;
  }

  const config = categoryConfig[notice.category] || categoryConfig.general;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* 카테고리 + 고정 */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Badge label={config.label} variant={config.variant} />
          {notice.is_pinned && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="pin" size={14} color={Colors.warm[500]} />
              <Text style={{ fontSize: 12, color: Colors.warm[500], fontWeight: "600" }}>고정</Text>
            </View>
          )}
        </View>

        {/* 제목 */}
        <Text style={{ fontSize: 22, fontWeight: "700", color: Colors.gray[900], marginBottom: 16 }}>
          {notice.title}
        </Text>

        {/* 작성자 + 작성일 */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] }}>
          <Avatar name={author?.name || "?"} imageUrl={author?.profile_image} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.gray[900] }}>{author?.name || "관리자"}</Text>
            <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{formatFullDateTime(notice.created_at)}</Text>
          </View>
          {isAdmin && (
            <Pressable onPress={() => setShowMenu(true)} hitSlop={8}>
              <Ionicons name="ellipsis-vertical" size={22} color={Colors.gray[500]} />
            </Pressable>
          )}
        </View>

        {/* 내용 */}
        <Text style={{ fontSize: 16, color: Colors.gray[700], lineHeight: 26 }}>
          {notice.content}
        </Text>
      </ScrollView>

      {/* 관리자 메뉴 모달 */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowMenu(false)}>
          <Pressable style={{ backgroundColor: Colors.gray[0], borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 16 }} />
            <Pressable onPress={handleEdit} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] }}>
              <Ionicons name="create-outline" size={22} color={Colors.gray[700]} />
              <Text style={{ fontSize: 16, color: Colors.gray[900] }}>수정</Text>
            </Pressable>
            <Pressable onPress={togglePin} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] }}>
              <Ionicons name={notice.is_pinned ? "pin-outline" : "pin"} size={22} color={Colors.warm[500]} />
              <Text style={{ fontSize: 16, color: Colors.gray[900] }}>{notice.is_pinned ? "고정 해제" : "상단 고정"}</Text>
            </Pressable>
            <Pressable onPress={handleDelete} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }}>
              <Ionicons name="trash-outline" size={22} color={Colors.danger[500]} />
              <Text style={{ fontSize: 16, color: Colors.danger[500] }}>삭제</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 수정 모달 */}
      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.gray[0], paddingTop: 56 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] }}>
            <Pressable onPress={() => setEditing(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={26} color={Colors.gray[900]} />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>공지 수정</Text>
            <Button title="저장" variant="primary" size="sm" onPress={saveEdit} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* 카테고리 */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>카테고리</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <Pressable key={key} onPress={() => setEditCategory(key)} style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: editCategory === key ? Colors.primary[500] : Colors.gray[100],
                }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: editCategory === key ? "#FFF" : Colors.gray[700] }}>{cfg.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* 고정 */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.warm[50], borderRadius: 12, padding: 14, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="pin" size={16} color={Colors.warm[500]} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>상단 고정</Text>
              </View>
              <Switch value={editPinned} onValueChange={setEditPinned} trackColor={{ false: Colors.gray[200], true: Colors.primary[500] }} thumbColor="#FFF" />
            </View>

            {/* 제목 */}
            <TextInput value={editTitle} onChangeText={setEditTitle} placeholder="제목"
              style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], marginBottom: 16 }}
            />
            {/* 내용 */}
            <TextInput value={editContent} onChangeText={setEditContent} placeholder="내용" multiline
              style={{ fontSize: 15, color: Colors.gray[900], lineHeight: 24, minHeight: 200, textAlignVertical: "top" }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
