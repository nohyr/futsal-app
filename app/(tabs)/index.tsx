import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useTeam, usePosts, useSchedules, useNotices } from "../../hooks/useSupabase";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Colors } from "../../constants/colors";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { team, loading: teamLoading } = useTeam();
  const { posts, loading: postsLoading } = usePosts();
  const { schedules } = useSchedules();
  const { notices } = useNotices();

  const pinnedNotices = notices.filter((n: any) => n.is_pinned);
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);
  const weekSchedules = schedules
    .filter((s: any) => new Date(s.date) >= now && new Date(s.date) <= endOfWeek)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (teamLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {/* Important Notices */}
        {pinnedNotices.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionHeader title="중요 공지" actionLabel="전체보기" onAction={() => {}} />
            </View>
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              {pinnedNotices.map((notice: any) => (
                <Card key={notice.id} variant="warm">
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Ionicons name="pin" size={14} color={Colors.warm[500]} />
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{notice.created_at?.slice(0, 10)}</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }} numberOfLines={1}>{notice.title}</Text>
                  <Text style={{ fontSize: 14, color: Colors.gray[700], marginTop: 4 }} numberOfLines={2}>{notice.content}</Text>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* This Week's Schedule */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <SectionHeader title="이번 주 일정" actionLabel="전체보기" onAction={() => {}} />
          {weekSchedules.length === 0 ? (
            <Card>
              <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", paddingVertical: 12 }}>이번 주 일정이 없습니다</Text>
            </Card>
          ) : (
            <View style={{ gap: 8 }}>
              {weekSchedules.map((s: any) => (
                <Card key={s.id}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Badge label={s.type === "match" ? "경기" : s.type === "training" ? "훈련" : "모임"} variant={s.type === "match" ? "primary" : "neutral"} />
                    <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{s.date} {s.time}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.gray[900] }}>
                    {s.opponent ? `vs ${s.opponent}` : s.description || s.type}
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.gray[500], marginTop: 2 }}>{s.location}</Text>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Recent Feed */}
        <View style={{ paddingHorizontal: 20 }}>
          <SectionHeader title="최신 피드" />
          {posts.length === 0 ? (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Ionicons name="document-text-outline" size={32} color={Colors.gray[300]} />
                <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>아직 게시글이 없습니다</Text>
                <Text style={{ fontSize: 13, color: Colors.gray[500] }}>첫 번째 게시글을 작성해보세요!</Text>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {posts.slice(0, 10).map((post: any) => (
                <Pressable key={post.id} onPress={() => router.push(`/post/${post.id}`)}>
                  <Card>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <Avatar name={post.users?.name || "?"} imageUrl={post.users?.profile_image} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.gray[900] }}>{post.users?.name}</Text>
                        <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{post.created_at?.slice(0, 10)}</Text>
                      </View>
                      <Badge
                        label={post.type === "video" ? "영상" : post.type === "record" ? "기록" : "피드백"}
                        variant={post.type === "video" ? "primary" : "neutral"}
                      />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.gray[900], marginBottom: 4 }}>{post.title}</Text>
                    <Text style={{ fontSize: 14, color: Colors.gray[700] }} numberOfLines={2}>{post.content}</Text>
                    <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="heart-outline" size={16} color={Colors.gray[500]} />
                        <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{post.likes?.length || 0}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="chatbubble-outline" size={14} color={Colors.gray[500]} />
                        <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{post.comments?.length || 0}</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/create-post/")}
        style={{
          position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
          backgroundColor: Colors.primary[500], alignItems: "center", justifyContent: "center",
          shadowColor: Colors.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}
