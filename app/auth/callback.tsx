import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Colors } from "../../constants/colors";

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    // Supabase가 URL hash에서 세션을 자동 파싱할 시간을 줌
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth/login");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[0] }}>
      <ActivityIndicator size="large" color={Colors.primary[500]} />
      <Text style={{ marginTop: 16, fontSize: 15, color: Colors.gray[500] }}>로그인 처리 중...</Text>
    </View>
  );
}
