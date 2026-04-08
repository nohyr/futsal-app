import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { teams as teamsApi } from "../../lib/api";

type Mode = "select" | "create" | "join";

export default function TeamSetupScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<Mode>("select");

  // Create team state
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");

  // Join team state
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!teamName.trim()) {
      setError("팀 이름을 입력해주세요.");
      return;
    }
    try {
      await teamsApi.create(teamName, teamDesc);
      await refreshUser();
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "팀 생성에 실패했습니다.");
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError("초대 코드를 입력해주세요.");
      return;
    }
    try {
      await teamsApi.join(inviteCode);
      await refreshUser();
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "유효하지 않은 초대 코드입니다.");
    }
  };

  if (mode === "select") {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.gray[0], padding: 24, justifyContent: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 }}>
          팀 설정
        </Text>
        <Text style={{ fontSize: 15, color: Colors.gray[500], marginBottom: 40 }}>
          새 팀을 만들거나 기존 팀에 참가하세요
        </Text>

        <View style={{ gap: 12 }}>
          <Pressable onPress={() => setMode("create")}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: Colors.primary[50], alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="add-circle" size={28} color={Colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>
                    새 팀 만들기
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.gray[500], marginTop: 2 }}>
                    팀을 새로 만들고 팀원을 초대하세요
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray[300]} />
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => setMode("join")}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: Colors.warm[50], alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="enter" size={28} color={Colors.warm[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>
                    팀 가입하기
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.gray[500], marginTop: 2 }}>
                    초대 코드로 기존 팀에 합류하세요
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray[300]} />
              </View>
            </Card>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.gray[0] }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => { setMode("select"); setError(""); }} style={{ marginBottom: 24 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray[900]} />
        </Pressable>

        {mode === "create" ? (
          <>
            <Text style={{ fontSize: 28, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 }}>
              새 팀 만들기
            </Text>
            <Text style={{ fontSize: 15, color: Colors.gray[500], marginBottom: 32 }}>
              팀 정보를 입력하세요
            </Text>

            <View style={{ gap: 16, marginBottom: 24 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>
                  팀 이름 *
                </Text>
                <TextInput
                  value={teamName}
                  onChangeText={(t) => { setTeamName(t); setError(""); }}
                  placeholder="예: FC 브레이브"
                  placeholderTextColor={Colors.gray[300]}
                  style={{
                    backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1,
                    borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14,
                    fontSize: 15, color: Colors.gray[900],
                  }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>
                  팀 소개
                </Text>
                <TextInput
                  value={teamDesc}
                  onChangeText={setTeamDesc}
                  placeholder="팀 소개를 간단히 적어주세요"
                  placeholderTextColor={Colors.gray[300]}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1,
                    borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14,
                    fontSize: 15, color: Colors.gray[900], minHeight: 80, textAlignVertical: "top",
                  }}
                />
              </View>
            </View>

            {error ? (
              <View style={{ backgroundColor: Colors.danger[50], borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: Colors.danger[500] }}>{error}</Text>
              </View>
            ) : null}

            <Button title="팀 만들기" variant="primary" size="lg" onPress={handleCreate} />
          </>
        ) : (
          <>
            <Text style={{ fontSize: 28, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 }}>
              팀 가입하기
            </Text>
            <Text style={{ fontSize: 15, color: Colors.gray[500], marginBottom: 32 }}>
              팀 운영진에게 받은 초대 코드를 입력하세요
            </Text>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>
                초대 코드
              </Text>
              <TextInput
                value={inviteCode}
                onChangeText={(t) => { setInviteCode(t.toUpperCase()); setError(""); }}
                placeholder="예: BRAVE2026"
                placeholderTextColor={Colors.gray[300]}
                autoCapitalize="characters"
                style={{
                  backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1,
                  borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14,
                  fontSize: 18, fontWeight: "600", color: Colors.gray[900],
                  textAlign: "center", letterSpacing: 2,
                }}
              />
            </View>

            {error ? (
              <View style={{ backgroundColor: Colors.danger[50], borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: Colors.danger[500] }}>{error}</Text>
              </View>
            ) : null}

            <Button title="가입하기" variant="primary" size="lg" onPress={handleJoin} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
