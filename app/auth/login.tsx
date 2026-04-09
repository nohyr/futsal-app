import { useState } from "react";
import { View, Text, Pressable, Platform, ActivityIndicator, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Colors } from "../../constants/colors";
import { supabase } from "../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = "futsal-app://auth/callback";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = async () => {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        await supabase.auth.signInWithOAuth({ provider: "kakao" });
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: REDIRECT_URI, skipBrowserRedirect: true },
      });

      if (error || !data?.url) {
        Alert.alert("오류", "로그인 URL 생성에 실패했습니다.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);

      if (result.type === "success" && result.url) {
        const url = result.url;
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        const hashIndex = url.indexOf("#");
        if (hashIndex !== -1) {
          const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
          accessToken = hashParams.get("access_token");
          refreshToken = hashParams.get("refresh_token");
        }
        if (!accessToken) {
          const queryIndex = url.indexOf("?");
          if (queryIndex !== -1) {
            const queryParams = new URLSearchParams(url.substring(queryIndex + 1));
            accessToken = queryParams.get("access_token");
            refreshToken = queryParams.get("refresh_token");
          }
        }

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error("Session error:", sessionError);
            Alert.alert("오류", "세션 설정에 실패했습니다.");
          }
        } else {
          Alert.alert("오류", "로그인 토큰을 받지 못했습니다. 다시 시도해주세요.");
        }
      }
    } catch (e: any) {
      console.error("Kakao login error:", e);
      Alert.alert("오류", "로그인 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[0] }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        {/* 로고 + 팀명 */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <Image
            source={require("../../assets/defe-spirit-logo.png")}
            style={{ width: 120, height: 120, marginBottom: 24 }}
            resizeMode="contain"
          />

          <Text style={{
            fontSize: 28, fontWeight: "800", color: Colors.gray[900],
            letterSpacing: 1,
          }}>
            데프스피릿 FC
          </Text>

          <View style={{
            marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
            borderRadius: 20, backgroundColor: Colors.warm[50],
            borderWidth: 1, borderColor: Colors.warm[400],
          }}>
            <Text style={{
              fontSize: 14, fontWeight: "600", color: Colors.warm[500],
              letterSpacing: 2,
            }}>
              가장 나답게!
            </Text>
          </View>
        </View>

        {/* 카카오 로그인 버튼 */}
        <Pressable
          onPress={handleKakaoLogin}
          disabled={loading}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            height: 54,
            borderRadius: 14,
            backgroundColor: pressed ? "#F5DC00" : "#FEE500",
            opacity: loading ? 0.7 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          })}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#191919" />
          ) : (
            <>
              <Ionicons name="chatbubble" size={18} color="#191919" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#191919" }}>
                카카오로 시작하기
              </Text>
            </>
          )}
        </Pressable>

        <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 24, textAlign: "center", lineHeight: 18 }}>
          로그인하면 서비스 이용약관 및{"\n"}개인정보 처리방침에 동의하게 됩니다.
        </Text>
      </View>

      {/* 하단 크레딧 */}
      <View style={{ paddingBottom: 40, alignItems: "center" }}>
        <Text style={{ fontSize: 11, color: Colors.gray[300] }}>
          Powered by 풋살메이트
        </Text>
      </View>
    </View>
  );
}
