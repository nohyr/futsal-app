import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Text } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { supabase } from "../lib/supabase";
import { Colors } from "../constants/colors";

function AuthGate() {
  const { isLoggedIn, isLoading, teams } = useAuth();
  usePushNotifications(); // 로그인 후 푸시 토큰 자동 등록
  const router = useRouter();
  const segments = useSegments();
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // OAuth 콜백 처리: URL hash에 access_token이 있으면 세션 파싱 대기
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        setIsProcessingCallback(true);

        // Supabase가 hash를 파싱할 시간을 줌
        const checkSession = async () => {
          // 최대 5초간 세션 확인 시도
          for (let i = 0; i < 10; i++) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // hash 제거
              window.history.replaceState(null, "", window.location.pathname);
              setIsProcessingCallback(false);
              return;
            }
            await new Promise((r) => setTimeout(r, 500));
          }
          setIsProcessingCallback(false);
        };
        checkSession();
      }
    }
  }, []);

  useEffect(() => {
    if (isLoading || isProcessingCallback) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (isLoggedIn && inAuthGroup) {
      if (teams.length === 0) {
        router.replace("/onboarding/team-setup");
      } else {
        router.replace("/(tabs)");
      }
    } else if (isLoggedIn && !inOnboarding && teams.length === 0) {
      router.replace("/onboarding/team-setup");
    }
  }, [isLoggedIn, isLoading, isProcessingCallback, teams, segments]);

  if (isLoading || isProcessingCallback) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[0] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        {isProcessingCallback && (
          <Text style={{ marginTop: 16, fontSize: 15, color: Colors.gray[500] }}>로그인 처리 중...</Text>
        )}
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/login" options={{ animation: "fade" }} />
      <Stack.Screen name="auth/signup" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="onboarding/team-setup" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="post/[id]"
        options={{ headerShown: true, headerTitle: "", headerBackTitle: "뒤로", headerTintColor: "#3182F6" }}
      />
      <Stack.Screen
        name="check-in/[scheduleId]"
        options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="create-post/index"
        options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="create-schedule/index"
        options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="create-notice/index"
        options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="create-record/index"
        options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="create-dues/index"
        options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="mypage/index"
        options={{ headerShown: true, headerTitle: "마이페이지", headerBackTitle: "뒤로", headerTintColor: "#3182F6" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </ToastProvider>
    </AuthProvider>
  );
}
