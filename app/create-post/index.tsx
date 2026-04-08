import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { posts as postsApi } from "../../lib/api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";

type PostType = "video" | "record" | "feedback";

const postTypes: { key: PostType; label: string; icon: string }[] = [
  { key: "video", label: "영상", icon: "videocam" },
  { key: "record", label: "기록", icon: "document-text" },
  { key: "feedback", label: "피드백", icon: "chatbox-ellipses" },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { currentTeamId } = useAuth();
  const [type, setType] = useState<PostType>("video");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !currentTeamId) return;
    setSubmitting(true);
    try {
      await postsApi.create(currentTeamId, { type, title, content });
      router.back();
    } catch (e) {
      console.error("create post error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.gray[0] }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.gray[200],
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="close" size={26} color={Colors.gray[900]} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>새 게시글</Text>
        <Button title={submitting ? "..." : "게시"} variant={canSubmit ? "primary" : "secondary"} size="sm" onPress={handleSubmit} disabled={!canSubmit} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {postTypes.map((pt) => (
            <Pressable
              key={pt.key} onPress={() => setType(pt.key)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                backgroundColor: type === pt.key ? Colors.primary[50] : Colors.gray[50],
                borderWidth: 1.5, borderColor: type === pt.key ? Colors.primary[500] : Colors.gray[200],
              }}
            >
              <Ionicons name={pt.icon as any} size={22} color={type === pt.key ? Colors.primary[500] : Colors.gray[500]} />
              <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 4, color: type === pt.key ? Colors.primary[500] : Colors.gray[500] }}>{pt.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput value={title} onChangeText={setTitle} placeholder="제목을 입력하세요" placeholderTextColor={Colors.gray[300]}
          style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], marginBottom: 16 }}
        />
        <TextInput value={content} onChangeText={setContent} placeholder="내용을 작성하세요..." placeholderTextColor={Colors.gray[300]} multiline
          style={{ fontSize: 15, color: Colors.gray[900], lineHeight: 24, minHeight: 160, textAlignVertical: "top" }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
