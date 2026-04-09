import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Modal, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { schedules as schedulesApi } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Colors } from "../../constants/colors";

const KAKAO_REST_KEY = "1f1c7f6fd7b9dc7985ae8c0e0344e61f";

type ScheduleType = "match" | "training" | "gathering";
const typeOptions: { key: ScheduleType; label: string; icon: string }[] = [
  { key: "match", label: "경기", icon: "football" },
  { key: "training", label: "훈련", icon: "fitness" },
  { key: "gathering", label: "모임", icon: "beer" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "10", "15", "20", "30", "40", "45", "50"];

interface PlaceResult {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string; // longitude
  y: string; // latitude
}

export default function CreateScheduleScreen() {
  const router = useRouter();
  const { currentTeamId } = useAuth();
  const { showToast } = useToast();
  const [type, setType] = useState<ScheduleType>("match");

  // 날짜
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // 시간
  const [startHour, setStartHour] = useState("14");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("16");
  const [endMin, setEndMin] = useState("00");
  const [showTimePicker, setShowTimePicker] = useState<"start" | "end" | null>(null);

  // 장소 검색
  const [locationQuery, setLocationQuery] = useState("");
  const [location, setLocation] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [opponent, setOpponent] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dateStr = selectedDay ? `${year}-${String(month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : "";
  const timeStr = `${startHour}:${startMin}`;
  const canSubmit = selectedDay && location.trim() && !submitting;

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
    } catch (e) {
      console.error("Place search error:", e);
    }
  }, []);

  const handleLocationInput = (text: string) => {
    setLocationQuery(text);
    setLocation(text);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => searchPlaces(text), 300);
    setSearchTimer(timer);
  };

  const selectPlace = (place: PlaceResult) => {
    setLocation(place.place_name);
    setLocationQuery(place.place_name);
    setSearchResults([]);
    setShowResults(false);
  };

  const handleSubmit = async () => {
    if (!selectedDay) { showToast("날짜를 선택해주세요", "error"); return; }
    if (!location.trim()) { showToast("장소를 입력해주세요", "error"); return; }
    if (!currentTeamId) return;
    setSubmitting(true);
    try {
      await schedulesApi.create(currentTeamId, {
        type, date: dateStr, time: timeStr,
        location, opponent: opponent || undefined,
        description: description || undefined,
      });
      showToast("일정이 등록되었습니다", "success");
      setTimeout(() => router.back(), 500);
    } catch (e) {
      console.error(e);
      showToast("저장에 실패했습니다", "error");
    } finally { setSubmitting(false); }
  };

  // 캘린더
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const prevMonth = () => { if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1); setSelectedDay(null); };
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>일정 등록</Text>
        <Button title={submitting ? "..." : "저장"} variant={canSubmit ? "primary" : "secondary"} size="sm" onPress={handleSubmit} disabled={!canSubmit} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {/* 유형 */}
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

        {/* ===== 날짜 캘린더 ===== */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 8 }}>날짜 *</Text>
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Pressable onPress={prevMonth} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={20} color={Colors.gray[700]} />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.gray[900] }}>{year}년 {month}월</Text>
            <Pressable onPress={nextMonth} style={{ padding: 4 }}>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[700]} />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {dayNames.map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: i === 0 ? Colors.danger[500] : i === 6 ? Colors.primary[500] : Colors.gray[500] }}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {calendarDays.map((day, i) => {
              const isSelected = day === selectedDay;
              const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
              const dow = i % 7;
              return (
                <Pressable key={i} onPress={() => day && setSelectedDay(day)} style={{ width: "14.28%", alignItems: "center", paddingVertical: 6 }}>
                  {day && (
                    <View style={[
                      { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
                      isSelected && { backgroundColor: Colors.primary[500] },
                      isToday && !isSelected && { borderWidth: 1.5, borderColor: Colors.primary[500] },
                    ]}>
                      <Text style={{
                        fontSize: 15, fontWeight: isSelected || isToday ? "700" : "400",
                        color: isSelected ? "#FFF" : dow === 0 ? Colors.danger[500] : dow === 6 ? Colors.primary[500] : Colors.gray[900],
                      }}>{day}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          {selectedDay && (
            <View style={{ marginTop: 8, alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary[500] }}>{dateStr}</Text>
            </View>
          )}
        </Card>

        {/* ===== 시간 선택 ===== */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginTop: 20, marginBottom: 8 }}>시간 *</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => setShowTimePicker("start")} style={{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingVertical: 14,
          }}>
            <Ionicons name="time-outline" size={18} color={Colors.primary[500]} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.gray[900] }}>{startHour}:{startMin}</Text>
            <Text style={{ fontSize: 12, color: Colors.gray[500] }}>시작</Text>
          </Pressable>
          <Text style={{ alignSelf: "center", fontSize: 16, color: Colors.gray[300] }}>~</Text>
          <Pressable onPress={() => setShowTimePicker("end")} style={{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingVertical: 14,
          }}>
            <Ionicons name="time-outline" size={18} color={Colors.gray[500]} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.gray[900] }}>{endHour}:{endMin}</Text>
            <Text style={{ fontSize: 12, color: Colors.gray[500] }}>종료</Text>
          </Pressable>
        </View>

        {/* ===== 장소 검색 (카카오맵 자동완성) ===== */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginTop: 20, marginBottom: 8 }}>장소 *</Text>
        <View style={{ position: "relative", zIndex: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: showResults ? Colors.primary[500] : Colors.gray[200] }}>
            <Ionicons name="search" size={18} color={Colors.gray[500]} style={{ marginLeft: 14 }} />
            <TextInput
              value={locationQuery}
              onChangeText={handleLocationInput}
              placeholder="풋살장, 구장 이름으로 검색"
              placeholderTextColor={Colors.gray[300]}
              onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
              style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: Colors.gray[900] }}
            />
            {locationQuery.length > 0 && (
              <Pressable onPress={() => { setLocationQuery(""); setLocation(""); setSearchResults([]); setShowResults(false); }} style={{ padding: 10 }}>
                <Ionicons name="close-circle" size={18} color={Colors.gray[300]} />
              </Pressable>
            )}
          </View>

          {/* 검색 결과 드롭다운 */}
          {showResults && searchResults.length > 0 && (
            <View style={{
              position: "absolute", top: 52, left: 0, right: 0,
              backgroundColor: Colors.gray[0], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200],
              shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
              maxHeight: 260, overflow: "hidden",
            }}>
              {searchResults.map((place, idx) => (
                <Pressable
                  key={place.id}
                  onPress={() => selectPlace(place)}
                  style={{
                    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12,
                    borderBottomWidth: idx < searchResults.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
                  }}
                >
                  <Ionicons name="location" size={18} color={Colors.primary[500]} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }} numberOfLines={1}>{place.place_name}</Text>
                    <Text style={{ fontSize: 12, color: Colors.gray[500], marginTop: 2 }} numberOfLines={1}>
                      {place.road_address_name || place.address_name}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>


        {/* 상대팀 */}
        {type === "match" && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>상대팀</Text>
            <TextInput value={opponent} onChangeText={setOpponent} placeholder="상대 팀 이름" placeholderTextColor={Colors.gray[300]}
              style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.gray[900] }}
            />
          </View>
        )}

        {/* 메모 */}
        <View style={{ marginTop: 16, marginBottom: 40 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[700], marginBottom: 6 }}>메모</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="추가 안내사항..." placeholderTextColor={Colors.gray[300]} multiline
            style={{ backgroundColor: Colors.gray[50], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.gray[900], minHeight: 80, textAlignVertical: "top" }}
          />
        </View>
      </ScrollView>

      {/* ===== 시간 피커 모달 ===== */}
      <Modal visible={!!showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setShowTimePicker(null)}>
          <View style={{ flex: 1 }} />
          <Pressable style={{
            backgroundColor: Colors.gray[0], borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.gray[900], marginBottom: 16 }}>
              {showTimePicker === "start" ? "시작 시간" : "종료 시간"}
            </Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[500], marginBottom: 8 }}>시</Text>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {HOURS.map((h) => {
                    const isActive = showTimePicker === "start" ? h === startHour : h === endHour;
                    return (
                      <Pressable key={h} onPress={() => { if (showTimePicker === "start") setStartHour(h); else setEndHour(h); }}
                        style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginBottom: 4, backgroundColor: isActive ? Colors.primary[500] : "transparent" }}>
                        <Text style={{ fontSize: 16, fontWeight: isActive ? "700" : "400", color: isActive ? "#FFF" : Colors.gray[900], textAlign: "center" }}>{h}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.gray[500], marginBottom: 8 }}>분</Text>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((m) => {
                    const isActive = showTimePicker === "start" ? m === startMin : m === endMin;
                    return (
                      <Pressable key={m} onPress={() => { if (showTimePicker === "start") setStartMin(m); else setEndMin(m); }}
                        style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginBottom: 4, backgroundColor: isActive ? Colors.primary[500] : "transparent" }}>
                        <Text style={{ fontSize: 16, fontWeight: isActive ? "700" : "400", color: isActive ? "#FFF" : Colors.gray[900], textAlign: "center" }}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            <Button title="확인" variant="primary" size="lg" style={{ marginTop: 16 }} onPress={() => setShowTimePicker(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
