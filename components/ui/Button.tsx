import { Pressable, Text, PressableProps, ViewStyle, TextStyle } from "react-native";
import { Colors } from "../../constants/colors";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

const variantStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.primary[500] },
    text: { color: "#FFFFFF", fontWeight: "600" },
  },
  secondary: {
    container: { backgroundColor: Colors.gray[100] },
    text: { color: Colors.gray[700], fontWeight: "600" },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: { color: Colors.primary[500], fontWeight: "600" },
  },
};

const sizeStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { height: 36, paddingHorizontal: 12 }, text: { fontSize: 13 } },
  md: { container: { height: 44, paddingHorizontal: 16 }, text: { fontSize: 14 } },
  lg: { container: { height: 52, paddingHorizontal: 20 }, text: { fontSize: 16 } },
};

export function Button({ title, variant = "primary", size = "md", style, ...props }: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <Pressable
      style={({ pressed }) => [
        {
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
        },
        v.container,
        s.container,
        style,
      ]}
      {...props}
    >
      <Text style={[v.text, s.text]}>{title}</Text>
    </Pressable>
  );
}
