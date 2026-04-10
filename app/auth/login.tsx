import { useEffect } from "react";
import { View, Text, Pressable, Platform, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Colors } from "../../constants/colors";
import { supabase } from "../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {

  // Deep link 리스너 — 항상 활성화
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      processUrl(event.url);
    };

    const subscription = Linking.addEventListener("url", handleUrl);

    // 앱이 cold start로 열렸을 때 초기 URL 확인
    Linking.getInitialURL().then((url) => {
      if (url) processUrl(url);
    });

    return () => subscription.remove();
  }, []);

  const processUrl = async (url: string) => {
    try {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // #access_token=...
      const hashIndex = url.indexOf("#");
      if (hashIndex !== -1) {
        const params = new URLSearchParams(url.substring(hashIndex + 1));
        accessToken = params.get("access_token");
        refreshToken = params.get("refresh_token");
      }

      // ?access_token=...
      if (!accessToken) {
        const qIndex = url.indexOf("?");
        if (qIndex !== -1) {
          const params = new URLSearchParams(url.substring(qIndex + 1));
          accessToken = params.get("access_token");
          refreshToken = params.get("refresh_token");
        }
      }

      // ?code=... (PKCE)
      if (!accessToken) {
        const codeMatch = url.match(/[?&#]code=([^&]+)/);
        if (codeMatch) {
          await supabase.auth.exchangeCodeForSession(codeMatch[1]);
          return;
        }
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    } catch (e) {
      console.error("processUrl error:", e);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      if (Platform.OS === "web") {
        await supabase.auth.signInWithOAuth({ provider: "kakao" });
        return;
      }

      const redirectUrl = "futsal-app://auth/callback";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        Alert.alert("오류", "로그인 URL 생성에 실패했습니다.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === "success" && result.url) {
        await processUrl(result.url);
      }
      // dismiss인 경우 — deep link 리스너(useEffect)가 처리

    } catch (e: any) {
      console.error("Kakao login error:", e);
      Alert.alert("오류", "로그인 중 문제가 발생했습니다.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[0] }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <Image
            source={require("../../assets/defe-spirit-logo.png")}
            style={{ width: 120, height: 120, marginBottom: 24 }}
            resizeMode="contain"
          />

          <Text style={{ fontSize: 28, fontWeight: "800", color: Colors.gray[900], letterSpacing: 1 }}>
            데프스피릿 FC
          </Text>

          <View style={{
            marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
            borderRadius: 20, backgroundColor: Colors.warm[50],
            borderWidth: 1, borderColor: Colors.warm[400],
          }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.warm[500], letterSpacing: 2 }}>
              가장 나답게!
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleKakaoLogin}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", height: 54, borderRadius: 14,
            backgroundColor: pressed ? "#F5DC00" : "#FEE500",
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
          })}
        >
          <Ionicons name="chatbubble" size={18} color="#191919" />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#191919" }}>카카오로 시작하기</Text>
        </Pressable>

        <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 24, textAlign: "center", lineHeight: 18 }}>
          로그인하면 서비스 이용약관 및{"\n"}개인정보 처리방침에 동의하게 됩니다.
        </Text>
      </View>

      <View style={{ paddingBottom: 40, alignItems: "center" }}>
        <Text style={{ fontSize: 11, color: Colors.gray[300] }}>Powered by 풋살메이트</Text>
      </View>
    </View>
  );
}
