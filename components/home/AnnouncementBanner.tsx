import { View, Text, ScrollView, Dimensions } from "react-native";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Colors } from "../../constants/colors";
import { Announcement } from "../../types";

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

const { width } = Dimensions.get("window");

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      decelerationRate="fast"
      snapToInterval={width - 28}
    >
      {announcements.map((item) => (
        <Card
          key={item.id}
          variant="warm"
          style={{ width: width - 52 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {item.isPinned && <Badge label="고정" variant="warning" />}
            <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{item.date}</Text>
          </View>
          <Text
            style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 4 }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.gray[700] }} numberOfLines={2}>
            {item.content}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}
