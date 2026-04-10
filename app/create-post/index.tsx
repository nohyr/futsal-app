import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { posts as postsApi, storage } from "../../lib/api";
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
  const { currentTeamId, user } = useAuth();
  const { showToast } = useToast();
  const [type, setType] = useState<PostType>("video");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("image");
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.7,
      videoMaxDuration: 300,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("video");
    }
  };

  const removeMedia = () => {
    setMediaUri(null);
    setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { showToast("제목을 입력해주세요", "error"); return; }
    if (!content.trim()) { showToast("내용을 입력해주세요", "error"); return; }
    if (!currentTeamId) return;
    setSubmitting(true);
    try {
      let videoUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      // 미디어 업로드
      if (mediaUri) {
        setUploading(true);
        const timestamp = Date.now();
        const res = await fetch(mediaUri);
        const blob = await res.blob();

        if (mediaType === "video") {
          const path = `${user?.id}/${timestamp}.mp4`;
          videoUrl = await storage.uploadVideo(path, blob);
        } else {
          const path = `${user?.id}/${timestamp}.jpg`;
          thumbnailUrl = await storage.uploadImage(path, blob);
        }
        setUploading(false);
      }

      await postsApi.create(currentTeamId, {
        type, title, content,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      });
      showToast("게시글이 등록되었습니다", "success");
      setTimeout(() => router.back(), 500);
    } catch (e) {
      console.error("create post error:", e);
      showToast("저장에 실패했습니다", "error");
      setUploading(false);
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
        <Button title={submitting ? (uploading ? "업로드중..." : "...") : "게시"} variant={title.trim() && content.trim() ? "primary" : "secondary"} size="sm" onPress={handleSubmit} disabled={submitting} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {/* 유형 */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {postTypes.map((pt) => (
            <Pressable key={pt.key} onPress={() => setType(pt.key)} style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
              backgroundColor: type === pt.key ? Colors.primary[50] : Colors.gray[50],
              borderWidth: 1.5, borderColor: type === pt.key ? Colors.primary[500] : Colors.gray[200],
            }}>
              <Ionicons name={pt.icon as any} size={22} color={type === pt.key ? Colors.primary[500] : Colors.gray[500]} />
              <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 4, color: type === pt.key ? Colors.primary[500] : Colors.gray[500] }}>{pt.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* 제목 */}
        <TextInput value={title} onChangeText={setTitle} placeholder="제목을 입력하세요" placeholderTextColor={Colors.gray[300]}
          style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], marginBottom: 16 }}
        />

        {/* 내용 */}
        <TextInput value={content} onChangeText={setContent} placeholder="내용을 작성하세요..." placeholderTextColor={Colors.gray[300]} multiline
          style={{ fontSize: 15, color: Colors.gray[900], lineHeight: 24, minHeight: 120, textAlignVertical: "top", marginBottom: 20 }}
        />

        {/* 미디어 첨부 */}
        {mediaUri ? (
          <View style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <Image source={{ uri: mediaUri }} style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: Colors.gray[100] }} />
            <Pressable onPress={removeMedia} style={{
              position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
              backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name="close" size={16} color="#FFF" />
            </Pressable>
            <View style={{ position: "absolute", bottom: 8, left: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Ionicons name={mediaType === "video" ? "videocam" : "image"} size={14} color="#FFF" />
                <Text style={{ fontSize: 12, color: "#FFF", fontWeight: "600" }}>{mediaType === "video" ? "영상" : "사진"} 첨부됨</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <Pressable onPress={pickImage} style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
              paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: Colors.gray[200],
            }}>
              <Ionicons name="image-outline" size={20} color={Colors.gray[500]} />
              <Text style={{ fontSize: 14, color: Colors.gray[500] }}>사진</Text>
            </Pressable>
            <Pressable onPress={pickVideo} style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
              paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: Colors.gray[200],
            }}>
              <Ionicons name="videocam-outline" size={20} color={Colors.gray[500]} />
              <Text style={{ fontSize: 14, color: Colors.gray[500] }}>영상</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
