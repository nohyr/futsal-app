import { View, Text, Pressable } from "react-native";
import { Colors } from "../../constants/colors";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900] }}>{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text style={{ fontSize: 14, color: Colors.primary[500], fontWeight: "500" }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
