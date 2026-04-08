import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { schedules as schedulesApi } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";

type ScheduleType = "match" | "training" | "gathering";
const typeOptions: { key: ScheduleType; label: string; icon: string }[] = [
  { key: "match", label: "경기", icon: "football" },
  { key: "training", label: "훈련", icon: "fitness" },
  { key: "gathering", label: "모임", icon: "beer" },
];

export default function CreateScheduleScreen() {
  const router = useRouter();
  const { currentTeamId } = useAuth();
  const [type, setType] = useState<ScheduleType>("match");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [opponent, setOpponent] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = date.trim() && time.trim() && location.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !currentTeamId) return;
    setSubmitting(true);
    try {
      await schedulesApi.create(currentTeamId, { type, date, time, location, opponent: opponent || undefined, description: description || undefined });
      router.back();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.gray[0] }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.gray[200],
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}><Ionicons name="close" size={26} color={Colors.gray[900]} /></Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>일정 등록</Text>
        <Button title={submitting ? "..." : "저장"} variant={canSubmit ? "primary" : "secondary"} size="sm" onPress={handleSubmit} disabled={!canSubmit} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>유형</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
          {typeOptions.map((opt) => (
            <Pressable key={opt.key} onPress={() => setType(opt.key)} style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
              backgroundColor: type === opt.key ? Colors.primary[50] : Colors.gray[50],
              borderWidth: 1.5, borderColor: type === opt.key ? Colors.primary[500] : Colors.gray[200],
            }}>
              <Ionicons name={opt.icon as any} size={20} color={type === opt.key ? Colors.primary[500] : Colors.gray[500]} />
              <Text style={{ fontSize: 13, fontWeight: "600", marginTop: 4, color: type === opt.key ? Colors.primary[500] : Colors.gray[500] }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 16 }}>
          <Field label="날짜 *" value={date} onChange={setDate} placeholder="2026-04-20" />
          <Field label="시간 *" value={time} onChange={setTime} placeholder="14:00" />
          <Field label="장소 *" value={location} onChange={setLocation} placeholder="강남 풋살장" />
          {type === "match" && <Field label="상대팀" value={opponent} onChange={setOpponent} placeholder="상대 팀 이름" />}
          <View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>메모</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="추가 안내사항..." placeholderTextColor={Colors.gray[300]} multiline
              style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.gray[900], minHeight: 80, textAlignVertical: "top" }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (t: string) => void; placeholder: string }) {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={Colors.gray[300]}
        style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.gray[900] }}
      />
    </View>
  );
}
