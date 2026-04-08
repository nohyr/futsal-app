import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { signInWithKakao } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[0], justifyContent: "center", alignItems: "center", padding: 24 }}>
      {/* Logo */}
      <View style={{ alignItems: "center", marginBottom: 60 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: Colors.primary[50], alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}>
          <Ionicons name="football" size={40} color={Colors.primary[500]} />
        </View>
        <Text style={{ fontSize: 32, fontWeight: "700", color: Colors.gray[900] }}>
          풋살메이트
        </Text>
        <Text style={{ fontSize: 15, color: Colors.gray[500], marginTop: 6 }}>
          우리 팀 커뮤니티
        </Text>
      </View>

      {/* Kakao Login Button */}
      <Pressable
        onPress={signInWithKakao}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          height: 52,
          borderRadius: 12,
          backgroundColor: pressed ? "#F5DC00" : "#FEE500",
        })}
      >
        <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="chatbubble" size={18} color="#191919" />
        </View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#191919" }}>
          카카오 로그인
        </Text>
      </Pressable>

      <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 20, textAlign: "center", lineHeight: 18 }}>
        로그인하면 서비스 이용약관 및{"\n"}개인정보 처리방침에 동의하게 됩니다.
      </Text>
    </View>
  );
}
