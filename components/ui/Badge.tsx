import { View, Text, ViewStyle } from "react-native";
import { Colors } from "../../constants/colors";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.primary[50], text: Colors.primary[500] },
  success: { bg: Colors.success[50], text: Colors.success[500] },
  warning: { bg: Colors.warning[50], text: Colors.warning[500] },
  danger: { bg: Colors.danger[50], text: Colors.danger[500] },
  neutral: { bg: Colors.gray[100], text: Colors.gray[700] },
};

export function Badge({ label, variant = "neutral", style }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          borderRadius: 9999,
          paddingHorizontal: 10,
          paddingVertical: 4,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
