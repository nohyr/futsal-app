import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRecords, useTeam, useAttendanceStats, useTeamStats, useDuesLedger, useMonthlySummary, useExpenses } from "../../hooks/useSupabase";
import { useAuth } from "../../context/AuthContext";
import { feeLedger as feeLedgerApi, expenses as expensesApi } from "../../lib/api";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Colors } from "../../constants/colors";

type TabKey = "archive" | "stats" | "dues";

const currentMonth = new Date().toISOString().slice(0, 7);

export default function RecordsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("archive");
  const { records, loading } = useRecords();
  const { team } = useTeam();
  const { stats: teamMatchStats } = useTeamStats();
  const { stats: attendanceStats } = useAttendanceStats();
  const { fees, loading: duesLoading, refresh: refreshDues } = useDuesLedger();
  const { expenses: expenseList, refresh: refreshExpenses } = useExpenses(currentMonth);
  const { summary, refresh: refreshSummary } = useMonthlySummary(currentMonth);

  const members = team?.team_members || [];
  const myMembership = members.find((m: any) => m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";

  const [expandedFee, setExpandedFee] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("venue");

  const handleTogglePaid = async (feeItemId: string, userId: string, currentlyPaid: boolean) => {
    if (currentlyPaid) {
      await feeLedgerApi.markUnpaid(feeItemId, userId);
    } else {
      await feeLedgerApi.markPaid(feeItemId, userId);
    }
    refreshDues();
  };

  const handleSendReminder = (feeItemId: string, feeName: string) => {
    Alert.alert("미납 알림", `"${feeName}" 미납자에게 알림을 보낼까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "보내기", onPress: async () => {
          const teamId = team?.id;
          if (teamId) {
            await feeLedgerApi.sendUnpaidReminder(teamId, feeItemId);
            Alert.alert("완료", "미납자에게 알림을 보냈습니다.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray[50] }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        {/* Tab Switcher */}
        <View style={{ flexDirection: "row", backgroundColor: Colors.gray[100], borderRadius: 12, padding: 4 }}>
          {([
            { key: "archive" as TabKey, label: "활동 기록" },
            { key: "stats" as TabKey, label: "팀 통계" },
            { key: "dues" as TabKey, label: "회비" },
          ]).map((tab) => (
            <Pressable
              key={tab.key} onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center",
                backgroundColor: activeTab === tab.key ? Colors.gray[0] : "transparent",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: activeTab === tab.key ? Colors.gray[900] : Colors.gray[500] }}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ===== 활동 기록 탭 ===== */}
        {activeTab === "archive" && (
          records.length === 0 ? (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Ionicons name="archive-outline" size={32} color={Colors.gray[300]} />
                <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>아직 기록이 없습니다</Text>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {records.map((record: any) => (
                <Card key={record.id}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Badge label={record.type === "match" ? "경기" : "훈련"} variant={record.type === "match" ? "primary" : "neutral"} />
                    <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{record.date}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>{record.title}</Text>
                    {record.our_score !== null && record.their_score !== null && (
                      <Text style={{
                        fontSize: 20, fontWeight: "700",
                        color: record.our_score > record.their_score ? Colors.primary[500] : record.our_score < record.their_score ? Colors.danger[500] : Colors.gray[500],
                      }}>
                        {record.our_score} - {record.their_score}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{record.location}</Text>
                  {record.memo && (
                    <View style={{ backgroundColor: Colors.warm[50], borderRadius: 8, padding: 10, marginTop: 8 }}>
                      <Text style={{ fontSize: 13, color: Colors.gray[700] }}>{record.memo}</Text>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          )
        )}

        {/* ===== 팀 통계 탭 ===== */}
        {activeTab === "stats" && (
          <View style={{ gap: 20 }}>
            {/* 팀 전적 */}
            {teamMatchStats && teamMatchStats.total_matches > 0 && (
              <Card>
                <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>시즌 전적</Text>
                <Text style={{ fontSize: 13, color: Colors.gray[500], marginBottom: 16 }}>총 {Number(teamMatchStats.total_matches)}경기</Text>

                {/* 승/무/패 */}
                <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 16 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 32, fontWeight: "700", color: Colors.primary[500] }}>{Number(teamMatchStats.wins)}</Text>
                    <Text style={{ fontSize: 13, color: Colors.gray[500] }}>승</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 32, fontWeight: "700", color: Colors.gray[500] }}>{Number(teamMatchStats.draws)}</Text>
                    <Text style={{ fontSize: 13, color: Colors.gray[500] }}>무</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 32, fontWeight: "700", color: Colors.danger[500] }}>{Number(teamMatchStats.losses)}</Text>
                    <Text style={{ fontSize: 13, color: Colors.gray[500] }}>패</Text>
                  </View>
                </View>

                {/* 비율 바 */}
                <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.gray[100], flexDirection: "row", overflow: "hidden", marginBottom: 16 }}>
                  {Number(teamMatchStats.wins) > 0 && <View style={{ flex: Number(teamMatchStats.wins), backgroundColor: Colors.primary[500] }} />}
                  {Number(teamMatchStats.draws) > 0 && <View style={{ flex: Number(teamMatchStats.draws), backgroundColor: Colors.gray[300] }} />}
                  {Number(teamMatchStats.losses) > 0 && <View style={{ flex: Number(teamMatchStats.losses), backgroundColor: Colors.danger[500] }} />}
                </View>

                {/* 승률 + 득실점 */}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View>
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>승률</Text>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: Colors.primary[500] }}>{Number(teamMatchStats.win_rate)}%</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>평균 득점</Text>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: Colors.gray[900] }}>{Number(teamMatchStats.avg_scored)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>평균 실점</Text>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: Colors.gray[900] }}>{Number(teamMatchStats.avg_conceded)}</Text>
                  </View>
                </View>
              </Card>
            )}

            {/* 최근 5경기 */}
            {teamMatchStats?.recent_matches?.length > 0 && (
              <Card>
                <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 12 }}>최근 경기</Text>
                {teamMatchStats.recent_matches.map((m: any, i: number) => {
                  const resultColor = m.result === "win" ? Colors.primary[500] : m.result === "loss" ? Colors.danger[500] : Colors.gray[500];
                  const resultLabel = m.result === "win" ? "승" : m.result === "loss" ? "패" : "무";
                  return (
                    <View key={m.id || i} style={{
                      flexDirection: "row", alignItems: "center", paddingVertical: 10,
                      borderBottomWidth: i < teamMatchStats.recent_matches.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
                    }}>
                      <View style={{
                        width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center",
                        backgroundColor: m.result === "win" ? Colors.primary[50] : m.result === "loss" ? Colors.danger[50] : Colors.gray[100],
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: resultColor }}>{resultLabel}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, color: Colors.gray[900], marginLeft: 10 }}>
                        vs {m.opponent || "상대팀"}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: resultColor }}>
                        {m.our_score} - {m.their_score}
                      </Text>
                      <Text style={{ fontSize: 12, color: Colors.gray[500], marginLeft: 8, width: 50 }}>{m.date?.slice(5)}</Text>
                    </View>
                  );
                })}
              </Card>
            )}

            <Card>
              <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>{team?.name}</Text>
              <Text style={{ fontSize: 13, color: Colors.gray[500], marginBottom: 20 }}>멤버 {members.length}명</Text>
              {members.length > 0 && (
                <View>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 12 }}>개인 기록</Text>
                  {[...members].sort((a: any, b: any) => (b.goals || 0) - (a.goals || 0)).map((m: any, i: number) => (
                    <View key={m.id} style={{
                      flexDirection: "row", alignItems: "center", paddingVertical: 10,
                      borderBottomWidth: i < members.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
                    }}>
                      <Text style={{ width: 28, fontSize: 16, fontWeight: "700", color: i < 3 ? Colors.primary[500] : Colors.gray[500], textAlign: "center" }}>{i + 1}</Text>
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: Colors.gray[900], marginLeft: 12 }}>{m.users?.name || "멤버"}</Text>
                      <Text style={{ fontSize: 14, color: Colors.gray[500], marginRight: 12 }}>⚽ {m.goals || 0}</Text>
                      <Text style={{ fontSize: 14, color: Colors.gray[500] }}>🅰️ {m.assists || 0}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            {attendanceStats.length > 0 && (
              <Card>
                <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 12 }}>출석률</Text>
                {[...attendanceStats].sort((a: any, b: any) => (b.attendance_rate || 0) - (a.attendance_rate || 0)).map((stat: any, i: number) => (
                  <View key={stat.user_id} style={{
                    flexDirection: "row", alignItems: "center", paddingVertical: 10,
                    borderBottomWidth: i < attendanceStats.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
                  }}>
                    <Text style={{ width: 28, fontSize: 16, fontWeight: "700", color: i < 3 ? Colors.primary[500] : Colors.gray[500], textAlign: "center" }}>{i + 1}</Text>
                    <Avatar name={stat.user_name || "?"} imageUrl={stat.profile_image} size={32} style={{ marginLeft: 8 }} />
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: Colors.gray[900], marginLeft: 10 }}>{stat.user_name}</Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.primary[500] }}>{stat.attendance_rate}%</Text>
                      <Text style={{ fontSize: 11, color: Colors.gray[500] }}>{stat.attended}/{stat.total_events}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </View>
        )}

        {/* ===== 회비 탭 ===== */}
        {activeTab === "dues" && (
          <View style={{ gap: 16 }}>
            {/* 월별 요약 */}
            {summary && (
              <Card>
                <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 4 }}>
                  {currentMonth.replace("-", "년 ")}월 요약
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 16, marginBottom: 12 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "700", color: Colors.primary[500] }}>
                      {Number(summary.paid_amount).toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>수입</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "700", color: Colors.danger[500] }}>
                      {Number(summary.total_expenses || 0).toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>지출</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "700", color: Number(summary.balance || 0) >= 0 ? Colors.success[500] : Colors.danger[500] }}>
                      {Number(summary.balance || 0).toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.gray[500] }}>잔액</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: Colors.gray[500] }}>납부율</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.gray[700] }}>{summary.payment_rate}%</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.gray[100], overflow: "hidden" }}>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.success[500], width: `${summary.payment_rate}%` }} />
                </View>
              </Card>
            )}

            {/* 회비 항목 리스트 */}
            {duesLoading ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            ) : fees.length === 0 ? (
              <Card>
                <View style={{ alignItems: "center", paddingVertical: 24 }}>
                  <Ionicons name="wallet-outline" size={32} color={Colors.gray[300]} />
                  <Text style={{ fontSize: 14, color: Colors.gray[500], marginTop: 8 }}>아직 회비 항목이 없습니다</Text>
                </View>
              </Card>
            ) : (
              fees.map((fee: any) => {
                const isExpanded = expandedFee === fee.id;
                const categoryLabels: Record<string, string> = { monthly: "월회비", special: "특별", penalty: "벌금" };

                return (
                  <Card key={fee.id}>
                    <Pressable onPress={() => setExpandedFee(isExpanded ? null : fee.id)}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Badge label={categoryLabels[fee.category] || "회비"} variant={fee.category === "penalty" ? "danger" : fee.category === "special" ? "warning" : "primary"} />
                        {fee.month && <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{fee.month}</Text>}
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View>
                          <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900] }}>{fee.name}</Text>
                          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginTop: 2 }}>
                            {Number(fee.amount).toLocaleString()}원
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 16, fontWeight: "700", color: fee.paid_count === fee.total_count ? Colors.success[500] : Colors.warning[500] }}>
                            {fee.paid_count}/{fee.total_count}
                          </Text>
                          <Text style={{ fontSize: 11, color: Colors.gray[500] }}>납부</Text>
                          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.gray[500]} style={{ marginTop: 4 }} />
                        </View>
                      </View>
                    </Pressable>

                    {/* 팀원별 납부 상태 (펼침) */}
                    {isExpanded && (
                      <View style={{ borderTopWidth: 1, borderTopColor: Colors.gray[100], marginTop: 12, paddingTop: 12, gap: 8 }}>
                        {(fee.payments || []).map((p: any) => (
                          <View key={p.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Avatar name={p.users?.name || "?"} imageUrl={p.users?.profile_image} size={28} />
                              <Text style={{ fontSize: 14, color: Colors.gray[900] }}>{p.users?.name}</Text>
                            </View>
                            {isAdmin ? (
                              <Pressable
                                onPress={() => handleTogglePaid(fee.id, p.user_id, p.is_paid)}
                                style={{
                                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                                  backgroundColor: p.is_paid ? Colors.success[50] : Colors.danger[50],
                                }}
                              >
                                <Text style={{
                                  fontSize: 13, fontWeight: "600",
                                  color: p.is_paid ? Colors.success[500] : Colors.danger[500],
                                }}>
                                  {p.is_paid ? "납부 ✓" : "미납"}
                                </Text>
                              </Pressable>
                            ) : (
                              <Badge label={p.is_paid ? "납부" : "미납"} variant={p.is_paid ? "success" : "danger"} />
                            )}
                          </View>
                        ))}

                        {/* 미납자 알림 버튼 (admin) */}
                        {isAdmin && fee.paid_count < fee.total_count && (
                          <Pressable
                            onPress={() => handleSendReminder(fee.id, fee.name)}
                            style={{
                              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                              marginTop: 8, paddingVertical: 10, borderRadius: 8,
                              backgroundColor: Colors.warm[50], borderWidth: 1, borderColor: Colors.warm[400],
                            }}
                          >
                            <Ionicons name="notifications-outline" size={16} color={Colors.warm[500]} />
                            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.warm[500] }}>
                              미납자 {fee.total_count - fee.paid_count}명에게 알림
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </Card>
                );
              })
            )}

            {/* ===== 지출 내역 ===== */}
            <SectionHeader title="지출 내역" />

            {/* 간편 지출 등록 (admin) */}
            {isAdmin && !showExpenseForm && (
              <Pressable
                onPress={() => setShowExpenseForm(true)}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                  paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed",
                  borderColor: Colors.gray[200],
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.gray[500]} />
                <Text style={{ fontSize: 14, color: Colors.gray[500] }}>지출 추가</Text>
              </Pressable>
            )}

            {isAdmin && showExpenseForm && (
              <Card>
                <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900], marginBottom: 12 }}>지출 등록</Text>
                <View style={{ gap: 10 }}>
                  <TextInput
                    value={expName} onChangeText={setExpName} placeholder="항목 (예: 구장 예약비)"
                    placeholderTextColor={Colors.gray[300]}
                    style={{
                      backgroundColor: Colors.gray[50], borderRadius: 8, borderWidth: 1, borderColor: Colors.gray[200],
                      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.gray[900],
                    }}
                  />
                  <TextInput
                    value={expAmount} onChangeText={setExpAmount} placeholder="금액" keyboardType="number-pad"
                    placeholderTextColor={Colors.gray[300]}
                    style={{
                      backgroundColor: Colors.gray[50], borderRadius: 8, borderWidth: 1, borderColor: Colors.gray[200],
                      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.gray[900],
                    }}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {([
                      { key: "venue", label: "구장" }, { key: "equipment", label: "장비" },
                      { key: "food", label: "음료/간식" }, { key: "uniform", label: "유니폼" }, { key: "etc", label: "기타" },
                    ]).map((c) => (
                      <Pressable
                        key={c.key} onPress={() => setExpCategory(c.key)}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                          backgroundColor: expCategory === c.key ? Colors.primary[500] : Colors.gray[100],
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "600", color: expCategory === c.key ? "#FFF" : Colors.gray[700] }}>{c.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    <Pressable
                      onPress={() => { setShowExpenseForm(false); setExpName(""); setExpAmount(""); }}
                      style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", backgroundColor: Colors.gray[100] }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.gray[700] }}>취소</Text>
                    </Pressable>
                    <Pressable
                      onPress={async () => {
                        if (!expName.trim() || !expAmount.trim() || !team?.id) return;
                        await expensesApi.create(team.id, {
                          name: expName, amount: Number(expAmount), category: expCategory,
                          month: currentMonth, date: new Date().toISOString().slice(0, 10),
                        });
                        setExpName(""); setExpAmount(""); setShowExpenseForm(false);
                        refreshExpenses(); refreshSummary();
                      }}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center",
                        backgroundColor: expName.trim() && expAmount.trim() ? Colors.primary[500] : Colors.gray[300],
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFF" }}>등록</Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}

            {/* 지출 목록 */}
            {expenseList.length === 0 ? (
              <Card>
                <View style={{ alignItems: "center", paddingVertical: 16 }}>
                  <Text style={{ fontSize: 14, color: Colors.gray[500] }}>이번 달 지출 내역이 없습니다</Text>
                </View>
              </Card>
            ) : (
              <View style={{ gap: 8 }}>
                {expenseList.map((exp: any) => {
                  const catLabels: Record<string, string> = { venue: "구장", equipment: "장비", food: "음료/간식", uniform: "유니폼", etc: "기타" };
                  return (
                    <Card key={exp.id}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <Badge label={catLabels[exp.category] || "기타"} variant="neutral" />
                            <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{exp.date || exp.created_at?.slice(0, 10)}</Text>
                          </View>
                          <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>{exp.name}</Text>
                          {exp.description && <Text style={{ fontSize: 13, color: Colors.gray[500], marginTop: 2 }}>{exp.description}</Text>}
                        </View>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.danger[500] }}>
                          -{Number(exp.amount).toLocaleString()}
                        </Text>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB — 탭별 분기 */}
      <Pressable
        onPress={() => {
          if (activeTab === "dues" && isAdmin) router.push("/create-dues/");
          else router.push("/create-record/");
        }}
        style={{
          position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
          backgroundColor: Colors.primary[500], alignItems: "center", justifyContent: "center",
          shadowColor: Colors.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}
