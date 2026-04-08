import { View, Text, Image, ImageStyle, ViewStyle } from "react-native";
import { Colors } from "../../constants/colors";

interface AvatarProps {
  name: string;
  number?: number;
  size?: number;
  imageUrl?: string | null;
  style?: ViewStyle;
}

type AnyStyle = ViewStyle | ImageStyle;

export function Avatar({ name, number, size = 40, imageUrl, style }: AvatarProps) {
  const initial = name.charAt(0);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.gray[100],
          },
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.warm[100],
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: Colors.warm[500],
          fontSize: size * 0.4,
          fontWeight: "700",
        }}
      >
        {number !== undefined ? `${number}` : initial}
      </Text>
    </View>
  );
}
