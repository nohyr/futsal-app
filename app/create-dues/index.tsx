import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { feeLedger } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";

type Category = "monthly" | "special" | "penalty";

const categoryOptions: { key: Category; label: string; icon: string }[] = [
  { key: "monthly", label: "월회비", icon: "calendar" },
  { key: "special", label: "특별", icon: "star" },
  { key: "penalty", label: "벌금", icon: "warning" },
];

export default function CreateDuesScreen() {
  const router = useRouter();
  const { currentTeamId } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("monthly");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && amount.trim() && Number(amount) > 0 && !submitting;

  const handleSubmit = async () => {
    if (!name.trim()) { showToast("항목명을 입력해주세요", "error"); return; }
    if (!amount.trim()) { showToast("금액을 입력해주세요", "error"); return; }
    if (!(Number(amount) > 0)) { showToast("올바른 금액을 입력해주세요", "error"); return; }
    if (!currentTeamId) return;
    setSubmitting(true);
    try {
      await feeLedger.create(currentTeamId, {
        name,
        amount: Number(amount),
        category,
        month: category === "monthly" ? month : undefined,
        description: description || undefined,
      });
      showToast("회비 항목이 등록되었습니다", "success");
      setTimeout(() => router.back(), 500);
    } catch (e) {
      console.error("create dues error:", e);
      showToast("저장에 실패했습니다", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.gray[0] }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.gray[200],
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="close" size={26} color={Colors.gray[900]} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>회비 등록</Text>
        <Button title={submitting ? "..." : "저장"} variant={canSubmit ? "primary" : "secondary"} size="sm" onPress={handleSubmit} disabled={!canSubmit} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {/* Category */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>유형</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
          {categoryOptions.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setCategory(opt.key)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                backgroundColor: category === opt.key ? Colors.primary[50] : Colors.gray[50],
                borderWidth: 1.5, borderColor: category === opt.key ? Colors.primary[500] : Colors.gray[200],
              }}
            >
              <Ionicons name={opt.icon as any} size={20} color={category === opt.key ? Colors.primary[500] : Colors.gray[500]} />
              <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 4, color: category === opt.key ? Colors.primary[500] : Colors.gray[500] }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 16 }}>
          {/* Name */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>항목명 *</Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder="예: 4월 회비"
              placeholderTextColor={Colors.gray[300]}
              style={{
                backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1,
                borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 15, color: Colors.gray[900],
              }}
            />
          </View>

          {/* Amount */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>금액 (원) *</Text>
            <TextInput
              value={amount} onChangeText={setAmount}
              placeholder="30000"
              placeholderTextColor={Colors.gray[300]}
              keyboardType="number-pad"
              style={{
                backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1,
                borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 20, fontWeight: "700", color: Colors.gray[900],
              }}
            />
          </View>

          {/* Month (monthly only) */}
          {category === "monthly" && (
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>월</Text>
              <TextInput
                value={month} onChangeText={setMonth}
                placeholder="2026-04"
                placeholderTextColor={Colors.gray[300]}
                style={{
                  backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1,
                  borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14,
                  fontSize: 15, color: Colors.gray[900],
                }}
              />
            </View>
          )}

          {/* Description */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>설명</Text>
            <TextInput
              value={description} onChangeText={setDescription}
              placeholder="추가 안내사항..."
              placeholderTextColor={Colors.gray[300]}
              multiline
              style={{
                backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1,
                borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 15, color: Colors.gray[900], minHeight: 80, textAlignVertical: "top",
              }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
