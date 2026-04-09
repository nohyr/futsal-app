import { useState } from "react";
import { View, Text, Pressable, Platform, ActivityIndicator, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Colors } from "../../constants/colors";
import { supabase } from "../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = async () => {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        await supabase.auth.signInWithOAuth({ provider: "kakao" });
        return;
      }

      // 네이티브: Linking URL을 redirect로 사용
      const redirectUrl = Linking.createURL("auth/callback");

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

      // 인앱 브라우저 열기
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === "success" && result.url) {
        await handleRedirectUrl(result.url);
      } else if (result.type === "dismiss") {
        // 브라우저가 dismiss됨 — deep link로 돌아온 경우
        // Linking 이벤트로 처리되므로 여기서는 패스
      }
    } catch (e: any) {
      console.error("Kakao login error:", e);
      Alert.alert("오류", "로그인 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // URL에서 세션 토큰 파싱
  const handleRedirectUrl = async (url: string) => {
    try {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // #access_token=... (fragment/implicit flow)
      const hashIndex = url.indexOf("#");
      if (hashIndex !== -1) {
        const params = new URLSearchParams(url.substring(hashIndex + 1));
        accessToken = params.get("access_token");
        refreshToken = params.get("refresh_token");
      }

      // ?access_token=... (query)
      if (!accessToken) {
        const qIndex = url.indexOf("?");
        if (qIndex !== -1) {
          const params = new URLSearchParams(url.substring(qIndex + 1));
          accessToken = params.get("access_token");
          refreshToken = params.get("refresh_token");
        }
      }

      // ?code=... (PKCE flow)
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
      console.error("handleRedirectUrl error:", e);
    }
  };

  // Deep link 리스너 — dismiss 후 URL이 Linking으로 올 때 처리
  useState(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      if (event.url.includes("access_token") || event.url.includes("code=")) {
        handleRedirectUrl(event.url);
      }
    });
    return () => subscription?.remove();
  });

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
          disabled={loading}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", height: 54, borderRadius: 14,
            backgroundColor: pressed ? "#F5DC00" : "#FEE500",
            opacity: loading ? 0.7 : 1,
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
          })}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#191919" />
          ) : (
            <>
              <Ionicons name="chatbubble" size={18} color="#191919" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#191919" }}>카카오로 시작하기</Text>
            </>
          )}
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
