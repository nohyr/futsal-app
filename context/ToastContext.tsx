import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { View, Text, Animated, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

const iconMap: Record<ToastType, { name: string; bg: string; border: string; text: string }> = {
  success: { name: "checkmark-circle", bg: Colors.success[50], border: Colors.success[500], text: Colors.success[500] },
  error: { name: "alert-circle", bg: Colors.danger[50], border: Colors.danger[500], text: Colors.danger[500] },
  warning: { name: "warning", bg: Colors.warning[50], border: Colors.warning[500], text: Colors.warning[500] },
  info: { name: "information-circle", bg: Colors.primary[50], border: Colors.primary[500], text: Colors.primary[500] },
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const config = iconMap[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => onRemove());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable onPress={onRemove} style={{
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: config.bg, borderLeftWidth: 4, borderLeftColor: config.border,
        borderRadius: 12, marginHorizontal: 20, marginBottom: 8,
        paddingHorizontal: 16, paddingVertical: 14,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4,
      }}>
        <Ionicons name={config.name as any} size={20} color={config.text} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: Colors.gray[900], lineHeight: 20 }}>
          {toast.message}
        </Text>
        <Ionicons name="close" size={16} color={Colors.gray[500]} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={{ position: "absolute", top: 56, left: 0, right: 0, zIndex: 9999 }} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
