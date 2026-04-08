import { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { posts as postsApi } from "../../lib/api";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";

const typeLabels: Record<string, string> = { video: "영상", record: "기록", feedback: "피드백" };
const typeVariants: Record<string, "primary" | "neutral" | "warning"> = { video: "primary", record: "neutral", feedback: "warning" };

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, users!author_id(*), comments(*, users!author_id(*)), likes(*)")
      .eq("id", id)
      .single();

    if (data) {
      setPost(data);
      setComments(data.comments || []);
      setLikeCount(data.likes?.length || 0);
      setIsLiked(data.likes?.some((l: any) => l.user_id === user?.id) || false);
    }
    setLoading(false);
  };

  const toggleLike = async () => {
    const liked = await postsApi.toggleLike(id!);
    setIsLiked(liked);
    setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    const newComment = await postsApi.addComment(id!, commentText.trim());
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.gray[50] }}>
        <Text style={{ fontSize: 16, color: Colors.gray[500] }}>게시글을 찾을 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {post.thumbnail_url && (
          <View>
            <Image source={{ uri: post.thumbnail_url }} style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: Colors.gray[100] }} />
            <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="play" size={28} color="#FFF" style={{ marginLeft: 3 }} />
              </View>
            </View>
          </View>
        )}

        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Avatar name={post.users?.name || "?"} imageUrl={post.users?.profile_image} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>{post.users?.name}</Text>
              <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{post.created_at?.slice(0, 10)}</Text>
            </View>
            <Badge label={typeLabels[post.type] || post.type} variant={typeVariants[post.type] || "neutral"} />
          </View>

          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 12 }}>{post.title}</Text>
          <Text style={{ fontSize: 15, color: Colors.gray[700], lineHeight: 24, marginBottom: 20 }}>{post.content}</Text>

          <View style={{ flexDirection: "row", gap: 20, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.gray[200], marginBottom: 24 }}>
            <Pressable onPress={toggleLike} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? Colors.danger[500] : Colors.gray[500]} />
              <Text style={{ fontSize: 14, color: Colors.gray[700] }}>좋아요 {likeCount}</Text>
            </Pressable>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.gray[500]} />
              <Text style={{ fontSize: 14, color: Colors.gray[700] }}>댓글 {comments.length}</Text>
            </View>
          </View>

          {comments.length > 0 ? (
            <View style={{ gap: 16 }}>
              {comments.map((c: any) => (
                <View key={c.id} style={{ flexDirection: "row", gap: 10 }}>
                  <Avatar name={c.users?.name || "?"} imageUrl={c.users?.profile_image} size={32} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[900] }}>{c.users?.name}</Text>
                      <Text style={{ fontSize: 11, color: Colors.gray[500] }}>{c.created_at?.slice(0, 10)}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: Colors.gray[700] }}>{c.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Ionicons name="chatbubble-outline" size={32} color={Colors.gray[300]} />
              <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>첫 번째 댓글을 남겨보세요</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        flexDirection: "row", alignItems: "center", gap: 8,
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32,
        backgroundColor: Colors.gray[0], borderTopWidth: 1, borderTopColor: Colors.gray[200],
      }}>
        <TextInput value={commentText} onChangeText={setCommentText} placeholder="댓글을 입력하세요..."
          placeholderTextColor={Colors.gray[500]} onSubmitEditing={addComment} returnKeyType="send"
          style={{ flex: 1, backgroundColor: Colors.gray[100], borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.gray[900] }}
        />
        <Pressable onPress={addComment} style={{
          width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
          backgroundColor: commentText.trim() ? Colors.primary[500] : Colors.gray[300],
        }}>
          <Ionicons name="arrow-up" size={20} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}
