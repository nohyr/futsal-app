import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text as RNText, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Text } from "react-native";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { supabase } from "../lib/supabase";
import { Colors } from "../constants/colors";

// 전역 Pretendard 폰트 적용
const defaultFontFamily = "Pretendard-Regular";
const oldTextRender = (RNText as any).render;
if (oldTextRender) {
  (RNText as any).render = function (...args: any[]) {
    const origin = oldTextRender.call(this, ...args);
    const style = origin.props?.style;
    const fontWeight = style?.fontWeight;
    let fontFamily = defaultFontFamily;
    if (fontWeight === "800" || fontWeight === "900") fontFamily = "Pretendard-ExtraBold";
    else if (fontWeight === "700" || fontWeight === "bold") fontFamily = "Pretendard-Bold";
    else if (fontWeight === "600") fontFamily = "Pretendard-SemiBold";
    else if (fontWeight === "500") fontFamily = "Pretendard-Medium";
    return { ...origin, props: { ...origin.props, style: [{ fontFamily }, style] } };
  };
}
const oldInputRender = (TextInput as any).render;
if (oldInputRender) {
  (TextInput as any).render = function (...args: any[]) {
    const origin = oldInputRender.call(this, ...args);
    return { ...origin, props: { ...origin.props, style: [{ fontFamily: defaultFontFamily }, origin.props?.style] } };
  };
}

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

  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || isProcessingCallback) return;

    // 초기 라우트 결정 (최초 1회)
    if (!isReady) {
      if (!isLoggedIn) {
        setInitialRoute("/auth/login");
      } else if (teams.length === 0) {
        setInitialRoute("/onboarding/team-setup");
      } else {
        setInitialRoute("/(tabs)");
      }
      setIsReady(true);
      return;
    }

    // 이후 상태 변경 시 라우팅
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
  }, [isLoggedIn, isLoading, isProcessingCallback, teams, segments, isReady]);

  // 초기 라우트가 결정되면 즉시 이동
  useEffect(() => {
    if (isReady && initialRoute) {
      router.replace(initialRoute as any);
    }
  }, [isReady, initialRoute]);

  if (!isReady || isLoading || isProcessingCallback) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[0] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
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
        name="notice/[id]"
        options={{ headerShown: true, headerTitle: "공지사항", headerBackTitle: "뒤로", headerTintColor: "#3182F6" }}
      />
      <Stack.Screen
        name="create-monthly/index"
        options={{ animation: "slide_from_bottom", presentation: "fullScreenModal" }}
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
        name="my-schedules/index"
        options={{ headerShown: true, headerTitle: "참여한 일정", headerBackTitle: "뒤로", headerTintColor: "#3182F6" }}
      />
      <Stack.Screen
        name="mypage/index"
        options={{ headerShown: true, headerTitle: "마이페이지", headerBackTitle: "뒤로", headerTintColor: "#3182F6" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.otf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
    "Pretendard-ExtraBold": require("../assets/fonts/Pretendard-ExtraBold.otf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[0] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </ToastProvider>
    </AuthProvider>
  );
}
