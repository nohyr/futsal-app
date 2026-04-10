import { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, TextInput, Pressable, ActivityIndicator, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import { posts as postsApi } from "../../lib/api";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { formatFullDateTime, formatRelativeTime } from "../../lib/utils";

const typeLabels: Record<string, string> = { video: "영상", record: "기록", feedback: "피드백" };
const typeVariants: Record<string, "primary" | "neutral" | "warning"> = { video: "primary", record: "neutral", feedback: "warning" };

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");

  // 수정 모달 상태
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => { loadPost(); }, [id]);

  const loadPost = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, users!author_id(*), comments(*, users!author_id(*)), likes(*)")
      .eq("id", id)
      .single();
    if (data) {
      setPost(data);
      setComments((data.comments || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
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
    if (newComment) { setComments((prev) => [...prev, newComment]); setCommentText(""); }
  };

  const isMyPost = post?.author_id === user?.id;

  // 게시글 수정
  const handleEditPost = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditingPost(true);
    setShowPostMenu(false);
  };

  const saveEditPost = async () => {
    await postsApi.update(id!, { title: editTitle, content: editContent });
    setPost((prev: any) => ({ ...prev, title: editTitle, content: editContent }));
    setEditingPost(false);
    showToast("게시글이 수정되었습니다", "success");
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    setShowPostMenu(false);
    await postsApi.delete(id!);
    showToast("게시글이 삭제되었습니다", "success");
    setTimeout(() => router.back(), 300);
  };

  // 댓글 수정
  const startEditComment = (c: any) => {
    setEditingCommentId(c.id);
    setEditCommentText(c.content);
  };

  const saveEditComment = async () => {
    if (!editingCommentId || !editCommentText.trim()) return;
    const updated = await postsApi.updateComment(editingCommentId, editCommentText.trim());
    if (updated) {
      setComments((prev) => prev.map((c) => c.id === editingCommentId ? updated : c));
    }
    setEditingCommentId(null);
    setEditCommentText("");
    showToast("댓글이 수정되었습니다", "success");
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    await postsApi.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    showToast("댓글이 삭제되었습니다", "success");
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>;
  }
  if (!post) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.gray[50] }}><Text style={{ fontSize: 16, color: Colors.gray[500] }}>게시글을 찾을 수 없습니다</Text></View>;
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
          {/* 작성자 + 메뉴 */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Avatar name={post.users?.name || "?"} imageUrl={post.users?.profile_image} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>{post.users?.name}</Text>
              <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{formatFullDateTime(post.created_at)}</Text>
            </View>
            <Badge label={typeLabels[post.type] || post.type} variant={typeVariants[post.type] || "neutral"} />
            {isMyPost && (
              <Pressable onPress={() => setShowPostMenu(true)} hitSlop={8}>
                <Ionicons name="ellipsis-vertical" size={20} color={Colors.gray[500]} />
              </Pressable>
            )}
          </View>

          {/* 제목 & 내용 */}
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 12 }}>{post.title}</Text>
          <Text style={{ fontSize: 15, color: Colors.gray[700], lineHeight: 24, marginBottom: 20 }}>{post.content}</Text>

          {/* 좋아요/댓글 */}
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

          {/* 댓글 목록 */}
          {comments.length > 0 ? (
            <View style={{ gap: 16 }}>
              {comments.map((c: any) => {
                const isMyComment = c.author_id === user?.id;
                const isEditing = editingCommentId === c.id;

                return (
                  <View key={c.id} style={{ flexDirection: "row", gap: 10 }}>
                    <Avatar name={c.users?.name || "?"} imageUrl={c.users?.profile_image} size={32} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[900] }}>{c.users?.name}</Text>
                        <Text style={{ fontSize: 11, color: Colors.gray[500] }}>{formatRelativeTime(c.created_at)}</Text>
                        {isMyComment && !isEditing && (
                          <View style={{ flexDirection: "row", gap: 8, marginLeft: "auto" }}>
                            <Pressable onPress={() => startEditComment(c)} hitSlop={6}>
                              <Text style={{ fontSize: 11, color: Colors.gray[500] }}>수정</Text>
                            </Pressable>
                            <Pressable onPress={() => handleDeleteComment(c.id)} hitSlop={6}>
                              <Text style={{ fontSize: 11, color: Colors.danger[500] }}>삭제</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                      {isEditing ? (
                        <View style={{ gap: 6 }}>
                          <TextInput value={editCommentText} onChangeText={setEditCommentText} multiline
                            style={{ backgroundColor: Colors.gray[50], borderRadius: 8, borderWidth: 1, borderColor: Colors.primary[500], paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: Colors.gray[900] }}
                          />
                          <View style={{ flexDirection: "row", gap: 6 }}>
                            <Pressable onPress={() => { setEditingCommentId(null); }} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.gray[100] }}>
                              <Text style={{ fontSize: 12, color: Colors.gray[700] }}>취소</Text>
                            </Pressable>
                            <Pressable onPress={saveEditComment} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.primary[500] }}>
                              <Text style={{ fontSize: 12, color: "#FFF" }}>저장</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 14, color: Colors.gray[700] }}>{c.content}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Ionicons name="chatbubble-outline" size={32} color={Colors.gray[300]} />
              <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>첫 번째 댓글을 남겨보세요</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 댓글 입력 */}
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

      {/* 게시글 메뉴 모달 */}
      <Modal visible={showPostMenu} transparent animationType="fade" onRequestClose={() => setShowPostMenu(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowPostMenu(false)}>
          <Pressable style={{ backgroundColor: Colors.gray[0], borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 16 }} />
            <Pressable onPress={handleEditPost} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] }}>
              <Ionicons name="create-outline" size={22} color={Colors.gray[700]} />
              <Text style={{ fontSize: 16, color: Colors.gray[900] }}>수정</Text>
            </Pressable>
            <Pressable onPress={handleDeletePost} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }}>
              <Ionicons name="trash-outline" size={22} color={Colors.danger[500]} />
              <Text style={{ fontSize: 16, color: Colors.danger[500] }}>삭제</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 게시글 수정 모달 */}
      <Modal visible={editingPost} transparent animationType="slide" onRequestClose={() => setEditingPost(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.gray[0], paddingTop: 56 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] }}>
            <Pressable onPress={() => setEditingPost(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={26} color={Colors.gray[900]} />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>게시글 수정</Text>
            <Button title="저장" variant="primary" size="sm" onPress={saveEditPost} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <TextInput value={editTitle} onChangeText={setEditTitle} placeholder="제목"
              style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100], marginBottom: 16 }}
            />
            <TextInput value={editContent} onChangeText={setEditContent} placeholder="내용" multiline
              style={{ fontSize: 15, color: Colors.gray[900], lineHeight: 24, minHeight: 200, textAlignVertical: "top" }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
