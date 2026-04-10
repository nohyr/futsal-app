import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { notices as noticesApi } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";

type Category = "general" | "schedule" | "location" | "fee" | "uniform" | "newmember";
const categories: { key: Category; label: string }[] = [
  { key: "general", label: "전체" }, { key: "schedule", label: "일정" },
  { key: "location", label: "장소" }, { key: "fee", label: "회비" },
  { key: "uniform", label: "유니폼" }, { key: "newmember", label: "신규팀원" },
];

export default function CreateNoticeScreen() {
  const router = useRouter();
  const { currentTeamId } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim() && content.trim() && !submitting;

  const handleSubmit = async () => {
    if (!title.trim()) { showToast("제목을 입력해주세요", "error"); return; }
    if (!content.trim()) { showToast("내용을 입력해주세요", "error"); return; }
    if (!currentTeamId) return;
    setSubmitting(true);
    try {
      await noticesApi.create(currentTeamId, { title, content, category, is_pinned: isPinned });
      showToast("공지가 등록되었습니다", "success");
      setTimeout(() => router.back(), 500);
    } catch (e) {
      console.error(e);
      showToast("저장에 실패했습니다", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.gray[0] }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.gray[200],
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}><Ionicons name="close" size={26} color={Colors.gray[900]} /></Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>공지 작성</Text>
        <Button title={submitting ? "..." : "게시"} variant={canSubmit ? "primary" : "secondary"} size="sm" onPress={handleSubmit} disabled={!canSubmit} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8 }}>
          {categories.map((cat) => (
            <Pressable key={cat.key} onPress={() => setCategory(cat.key)} style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
              backgroundColor: category === cat.key ? Colors.primary[500] : Colors.gray[100],
            }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: category === cat.key ? "#FFF" : Colors.gray[700] }}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          backgroundColor: Colors.warm[50], borderRadius: 12, padding: 16, marginBottom: 24,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="pin" size={18} color={Colors.warm[500]} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>상단 고정</Text>
          </View>
          <Switch value={isPinned} onValueChange={setIsPinned} trackColor={{ false: Colors.gray[200], true: Colors.primary[500] }} thumbColor="#FFF" />
        </View>
        <TextInput value={title} onChangeText={setTitle} placeholder="공지 제목" placeholderTextColor={Colors.gray[300]}
          style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], marginBottom: 16 }}
        />
        <TextInput value={content} onChangeText={setContent} placeholder="공지 내용을 작성하세요..." placeholderTextColor={Colors.gray[300]} multiline
          style={{ fontSize: 15, color: Colors.gray[900], lineHeight: 24, minHeight: 200, textAlignVertical: "top" }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
