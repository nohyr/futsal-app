import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Colors } from "../../constants/colors";
import { Post } from "../../types";

interface PostFeedItemProps {
  post: Post;
}

const typeLabels = { video: "영상", record: "기록", feedback: "피드백" };
const typeVariants = { video: "primary" as const, record: "neutral" as const, feedback: "warning" as const };

export function PostFeedItem({ post }: PostFeedItemProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/post/${post.id}`)}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar name={post.author.name} number={post.author.number} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.gray[900] }}>
              {post.author.name}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{post.date}</Text>
          </View>
          <Badge label={typeLabels[post.type]} variant={typeVariants[post.type]} />
        </View>

        <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.gray[900], marginBottom: 6 }}>
          {post.title}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.gray[700], marginBottom: 12 }} numberOfLines={2}>
          {post.content}
        </Text>

        {post.video && (
          <View style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <Image
              source={{ uri: post.video.thumbnailUrl }}
              style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: Colors.gray[100] }}
            />
            <View style={{
              position: "absolute", inset: 0, alignItems: "center", justifyContent: "center",
            }}>
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name="play" size={24} color="#FFF" style={{ marginLeft: 3 }} />
              </View>
            </View>
            <View style={{
              position: "absolute", bottom: 8, right: 8,
              backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
            }}>
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>{post.video.duration}</Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={18}
              color={post.isLiked ? Colors.danger[500] : Colors.gray[500]}
            />
            <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{post.likes}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.gray[500]} />
            <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{post.comments.length}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
