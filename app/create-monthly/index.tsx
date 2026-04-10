import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { monthlyAnnouncement } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";

const KAKAO_REST_KEY = "1f1c7f6fd7b9dc7985ae8c0e0344e61f";

interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  endTime: string;
  type: "practice" | "lesson" | "match";
  label: string;
}

interface PlaceResult {
  id: string;
  place_name: string;
  road_address_name: string;
  address_name: string;
}

const typeOptions = [
  { key: "practice", label: "개인 연습", icon: "fitness" },
  { key: "lesson", label: "레슨", icon: "school" },
  { key: "match", label: "경기", icon: "football" },
];

const feeOptions = ["레슨비", "구장비", "팀회비", "대회비", "음료비"];

export default function CreateMonthlyScreen() {
  const router = useRouter();
  const { currentTeamId } = useAuth();
  const { showToast } = useToast();

  // 월 선택
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [month, setMonth] = useState(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`);
  const monthLabel = month.replace("-", "년 ") + "월";

  // 일정
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("20:00");
  const [newEndTime, setNewEndTime] = useState("22:00");
  const [newType, setNewType] = useState<"practice" | "lesson" | "match">("practice");

  // 장소
  const [location, setLocation] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [locationAddress, setLocationAddress] = useState("");

  // 회비
  const [feeAmount, setFeeAmount] = useState("");
  const [feeIncludes, setFeeIncludes] = useState<string[]>(["레슨비", "구장비", "팀회비"]);

  // 입금
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("21:00");
  const [bankAccount, setBankAccount] = useState("데프스피릿 카카오뱅크 79420858554");

  // 한마디
  const [message, setMessage] = useState("");

  // 미리보기
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 카카오 장소 검색
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); setShowResults(false); return; }
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`,
        { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } },
      );
      const data = await res.json();
      setSearchResults(data.documents || []);
      setShowResults(true);
    } catch (e) { console.error(e); }
  }, []);

  const handleLocationInput = (text: string) => {
    setLocationQuery(text);
    setLocation(text);
    setLocationAddress("");
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => searchPlaces(text), 300);
    setSearchTimer(timer);
  };

  const selectPlace = (place: PlaceResult) => {
    setLocation(place.place_name);
    setLocationQuery(place.place_name);
    setLocationAddress(place.road_address_name || place.address_name);
    setSearchResults([]);
    setShowResults(false);
  };

  // 일정 추가
  const addScheduleItem = () => {
    if (!newDate) { showToast("날짜를 입력해주세요", "error"); return; }
    const typeLabel = typeOptions.find((t) => t.key === newType)?.label || "";
    setScheduleItems((prev) => [...prev, {
      id: Date.now().toString(),
      date: newDate,
      time: newTime,
      endTime: newEndTime,
      type: newType,
      label: typeLabel,
    }]);
    setNewDate("");
    setShowAddSchedule(false);
  };

  const removeScheduleItem = (id: string) => {
    setScheduleItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 공지 텍스트 생성
  const generateNoticeContent = () => {
    const scheduleByType = new Map<string, ScheduleItem[]>();
    scheduleItems.forEach((item) => {
      const key = item.type;
      if (!scheduleByType.has(key)) scheduleByType.set(key, []);
      scheduleByType.get(key)!.push(item);
    });

    let scheduleText = "";
    scheduleByType.forEach((items, type) => {
      const typeLabel = typeOptions.find((t) => t.key === type)?.label || type;
      const dates = items.map((i) => `${new Date(i.date).getDate()}일`).join(" / ");
      const timeRange = `${items[0].time} ~ ${items[0].endTime}`;
      scheduleText += `- ${dates} → ${typeLabel} (${timeRange})\n`;
    });

    const deadlineStr = deadlineDate ? `${deadlineDate.replace(/-/g, "년 ").replace(/년 (\d+)$/, "월 $1일")}` : "";
    const feeIncludesStr = feeIncludes.join(" + ");

    return `🤍 ${monthLabel} 클래스 & 회비 안내 🩶

📅 일정 (총 ${scheduleItems.length}회)
${scheduleText}
📍 장소
${location}${locationAddress ? ` (${locationAddress})` : ""}

💰 회비
- ${Number(feeAmount || 0).toLocaleString()}원 (${feeIncludesStr} 포함)

💸 입금 안내
- 기한: ${deadlineStr} ${deadlineTime}까지
- 계좌: ${bankAccount}
⚠️ 입금 후 환불 불가
${message ? `\n${message}` : ""}`;
  };

  const handleSubmit = async () => {
    if (!currentTeamId) return;
    if (scheduleItems.length === 0) { showToast("일정을 추가해주세요", "error"); return; }
    if (!location) { showToast("장소를 입력해주세요", "error"); return; }
    if (!feeAmount) { showToast("회비를 입력해주세요", "error"); return; }
    if (!deadlineDate) { showToast("입금 기한을 입력해주세요", "error"); return; }

    setSubmitting(true);
    try {
      await monthlyAnnouncement.create(currentTeamId, {
        month,
        scheduleItems: scheduleItems.map((s) => ({
          date: s.date, time: s.time, endTime: s.endTime, type: s.type, label: s.label,
        })),
        location,
        feeAmount: Number(feeAmount),
        feeIncludes,
        deadline: `${deadlineDate} ${deadlineTime}`,
        bankAccount,
        message,
        noticeContent: generateNoticeContent(),
      });
      showToast("월간 안내가 등록되었습니다", "success");
      setTimeout(() => router.back(), 500);
    } catch (e) {
      console.error(e);
      showToast("등록에 실패했습니다", "error");
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
        <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>월간 안내 생성</Text>
        <Pressable onPress={() => setShowPreview(true)}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.primary[500] }}>미리보기</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }} keyboardShouldPersistTaps="handled">

        {/* ===== 월 선택 ===== */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>월</Text>
          <TextInput value={month} onChangeText={setMonth} placeholder="2026-04" placeholderTextColor={Colors.gray[300]}
            style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 17, fontWeight: "700", color: Colors.gray[900] }}
          />
        </View>

        {/* ===== 일정 추가 ===== */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700] }}>📅 일정</Text>
            <Pressable onPress={() => setShowAddSchedule(true)} style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.primary[50],
            }}>
              <Ionicons name="add" size={16} color={Colors.primary[500]} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.primary[500] }}>추가</Text>
            </Pressable>
          </View>

          {scheduleItems.length === 0 ? (
            <View style={{ backgroundColor: Colors.gray[50], borderRadius: 12, padding: 20, alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: Colors.gray[500] }}>일정을 추가해주세요</Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              {scheduleItems.sort((a, b) => a.date.localeCompare(b.date)).map((item) => (
                <View key={item.id} style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: Colors.gray[50], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Badge label={item.label} variant={item.type === "lesson" ? "primary" : item.type === "match" ? "warning" : "neutral"} />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.gray[900] }}>
                      {new Date(item.date).getDate()}일
                    </Text>
                    <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{item.time}~{item.endTime}</Text>
                  </View>
                  <Pressable onPress={() => removeScheduleItem(item.id)} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={Colors.gray[300]} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ===== 장소 ===== */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>📍 장소</Text>
          <View style={{ position: "relative", zIndex: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: showResults ? Colors.primary[500] : Colors.gray[200] }}>
              <Ionicons name="search" size={18} color={Colors.gray[500]} style={{ marginLeft: 14 }} />
              <TextInput value={locationQuery} onChangeText={handleLocationInput} placeholder="풋살장 검색" placeholderTextColor={Colors.gray[300]}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: Colors.gray[900] }}
              />
              {locationQuery.length > 0 && (
                <Pressable onPress={() => { setLocationQuery(""); setLocation(""); setLocationAddress(""); setSearchResults([]); setShowResults(false); }} style={{ padding: 10 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.gray[300]} />
                </Pressable>
              )}
            </View>
            {showResults && searchResults.length > 0 && (
              <View style={{
                position: "absolute", top: 52, left: 0, right: 0, backgroundColor: Colors.gray[0], borderRadius: 12,
                borderWidth: 1, borderColor: Colors.gray[200], shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, maxHeight: 220, overflow: "hidden",
              }}>
                {searchResults.map((place, idx) => (
                  <Pressable key={place.id} onPress={() => selectPlace(place)} style={{
                    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12,
                    borderBottomWidth: idx < searchResults.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
                  }}>
                    <Ionicons name="location" size={18} color={Colors.primary[500]} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }} numberOfLines={1}>{place.place_name}</Text>
                      <Text style={{ fontSize: 12, color: Colors.gray[500] }} numberOfLines={1}>{place.road_address_name || place.address_name}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {locationAddress ? (
            <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 4, marginLeft: 4 }}>{locationAddress}</Text>
          ) : null}
        </View>

        {/* ===== 회비 ===== */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>💰 회비</Text>
          <TextInput value={feeAmount} onChangeText={setFeeAmount} placeholder="70000" placeholderTextColor={Colors.gray[300]} keyboardType="number-pad"
            style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 8 }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {feeOptions.map((opt) => {
              const isSelected = feeIncludes.includes(opt);
              return (
                <Pressable key={opt} onPress={() => {
                  setFeeIncludes((prev) => isSelected ? prev.filter((f) => f !== opt) : [...prev, opt]);
                }} style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                  backgroundColor: isSelected ? Colors.primary[500] : Colors.gray[100],
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: isSelected ? "#FFF" : Colors.gray[700] }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ===== 입금 안내 ===== */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>💸 입금 안내</Text>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput value={deadlineDate} onChangeText={setDeadlineDate} placeholder="2026-03-31" placeholderTextColor={Colors.gray[300]}
                style={{ flex: 2, backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.gray[900] }}
              />
              <TextInput value={deadlineTime} onChangeText={setDeadlineTime} placeholder="21:00" placeholderTextColor={Colors.gray[300]}
                style={{ flex: 1, backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.gray[900] }}
              />
            </View>
            <TextInput value={bankAccount} onChangeText={setBankAccount} placeholder="은행 계좌정보" placeholderTextColor={Colors.gray[300]}
              style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.gray[900] }}
            />
          </View>
        </View>

        {/* ===== 한마디 ===== */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>💬 한마디</Text>
          <TextInput value={message} onChangeText={setMessage} placeholder="4월은 대회 모드 ON🔥" placeholderTextColor={Colors.gray[300]} multiline
            style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.gray[900], minHeight: 60, textAlignVertical: "top" }}
          />
        </View>

        {/* 게시 버튼 */}
        <Button title={submitting ? "등록 중..." : "공지 + 회비 + 일정 한번에 등록"} variant="primary" size="lg" onPress={handleSubmit} disabled={submitting} />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== 일정 추가 모달 ===== */}
      <Modal visible={showAddSchedule} transparent animationType="slide" onRequestClose={() => setShowAddSchedule(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setShowAddSchedule(false)}>
          <View style={{ flex: 1 }} />
          <Pressable style={{
            backgroundColor: Colors.gray[0], borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.gray[900], marginBottom: 16 }}>일정 추가</Text>

            {/* 유형 */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {typeOptions.map((opt) => (
                <Pressable key={opt.key} onPress={() => setNewType(opt.key as any)} style={{
                  flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                  backgroundColor: newType === opt.key ? Colors.primary[50] : Colors.gray[50],
                  borderWidth: 1.5, borderColor: newType === opt.key ? Colors.primary[500] : Colors.gray[200],
                }}>
                  <Ionicons name={opt.icon as any} size={18} color={newType === opt.key ? Colors.primary[500] : Colors.gray[500]} />
                  <Text style={{ fontSize: 12, fontWeight: "600", marginTop: 2, color: newType === opt.key ? Colors.primary[500] : Colors.gray[500] }}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* 날짜 */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>날짜</Text>
            <TextInput value={newDate} onChangeText={setNewDate} placeholder={`${month}-02`} placeholderTextColor={Colors.gray[300]}
              style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: Colors.gray[900], marginBottom: 12 }}
            />

            {/* 시간 */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>시작</Text>
                <TextInput value={newTime} onChangeText={setNewTime} placeholder="20:00" placeholderTextColor={Colors.gray[300]}
                  style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: Colors.gray[900] }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>종료</Text>
                <TextInput value={newEndTime} onChangeText={setNewEndTime} placeholder="22:00" placeholderTextColor={Colors.gray[300]}
                  style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: Colors.gray[900] }}
                />
              </View>
            </View>

            <Button title="추가" variant="primary" size="lg" onPress={addScheduleItem} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===== 미리보기 모달 ===== */}
      <Modal visible={showPreview} transparent animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setShowPreview(false)}>
          <View style={{ flex: 1 }} />
          <Pressable style={{
            backgroundColor: Colors.gray[0], borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: "80%",
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.gray[900], marginBottom: 16 }}>미리보기</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Card variant="warm">
                <Text style={{ fontSize: 15, color: Colors.gray[900], lineHeight: 24 }}>
                  {generateNoticeContent()}
                </Text>
              </Card>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable onPress={() => setShowPreview(false)} style={{
                flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: Colors.gray[100],
              }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[700] }}>수정하기</Text>
              </Pressable>
              <Pressable onPress={() => { setShowPreview(false); handleSubmit(); }} style={{
                flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: Colors.primary[500],
              }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}>이대로 등록</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
