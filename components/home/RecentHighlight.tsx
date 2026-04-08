import { View, Text, Image, Pressable, FlatList } from "react-native";
import { Colors } from "../../constants/colors";
import { Video } from "../../types";

interface RecentHighlightProps {
  videos: Video[];
}

function VideoThumbnail({ video }: { video: Video }) {
  return (
    <Pressable style={{ width: 240, marginRight: 12 }}>
      <View style={{ borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={{ width: 240, height: 135, backgroundColor: Colors.gray[100] }}
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
      </View>
      <Text
        style={{ fontSize: 14, fontWeight: "600", color: Colors.gray[900] }}
        numberOfLines={1}
      >
        {video.title}
      </Text>
      <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 2 }}>{video.date}</Text>
    </Pressable>
  );
}

export function RecentHighlight({ videos }: RecentHighlightProps) {
  return (
    <FlatList
      horizontal
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <VideoThumbnail video={item} />}
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20 }}
    />
  );
}
