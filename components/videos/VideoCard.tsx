import { View, Text, Image, Pressable } from "react-native";
import { Colors } from "../../constants/colors";
import { Badge } from "../ui/Badge";
import { Video } from "../../types";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Pressable style={{ marginBottom: 16 }}>
      <View style={{ borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: Colors.gray[100] }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>{video.duration}</Text>
        </View>
        <View style={{ position: "absolute", top: 8, left: 8 }}>
          <Badge
            label={video.type === "highlight" ? "하이라이트" : "풀경기"}
            variant={video.type === "highlight" ? "primary" : "neutral"}
          />
        </View>
      </View>

      <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.gray[900] }}>
        {video.title}
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{video.date}</Text>
        {video.opponent && (
          <Text style={{ fontSize: 13, color: Colors.gray[500] }}>vs {video.opponent}</Text>
        )}
      </View>
    </Pressable>
  );
}
