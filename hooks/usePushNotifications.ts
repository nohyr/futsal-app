import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// 포그라운드에서도 알림 배너 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        saveTokenToDb(token);
      }
    });

    // 포그라운드 알림 수신
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification.request.content.title);
    });

    // 알림 탭 응답 → 해당 화면으로 이동
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.route) {
        router.push(data.route as string);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isLoggedIn, user]);

  const saveTokenToDb = async (token: string) => {
    if (!user) return;
    await supabase
      .from("users")
      .update({ push_token: token })
      .eq("id", user.id);
  };

  return { expoPushToken };
}

async function registerForPushNotifications(): Promise<string | null> {
  // 웹에서는 푸시 미지원
  if (Platform.OS === "web") return null;

  // 실제 디바이스에서만 동작
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // 권한 확인
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Android 채널 설정
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "풋살메이트",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Expo Push Token 발급
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "futsal-app",
    });
    return tokenData.data;
  } catch (e) {
    console.error("Failed to get push token:", e);
    return null;
  }
}

/** 외부에서 사용할 수 있는 로컬 알림 발송 유틸 */
export async function sendLocalNotification(title: string, body: string, data?: Record<string, any>) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null, // 즉시 발송
  });
}
