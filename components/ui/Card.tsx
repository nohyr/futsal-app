import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "warm";
  children: React.ReactNode;
}

export function Card({ variant = "default", children, style, ...props }: CardProps) {
  const bgColor = variant === "warm" ? "#FFF8F2" : "#FFFFFF";

  return (
    <View
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: 12,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
