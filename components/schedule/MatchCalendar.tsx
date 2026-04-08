import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { Colors } from "../../constants/colors";
import { Schedule } from "../../types";

interface MatchCalendarProps {
  schedules: Schedule[];
  month: number;
  year: number;
}

export function MatchCalendar({ schedules, month, year }: MatchCalendarProps) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const scheduleDates = new Map<number, Schedule[]>();
  schedules.forEach((s) => {
    const d = new Date(s.date);
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!scheduleDates.has(day)) scheduleDates.set(day, []);
      scheduleDates.get(day)!.push(s);
    }
  });

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  const todayDate = today.getDate();

  return (
    <Card>
      <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 16 }}>
        {year}년 {month}월
      </Text>

      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {dayNames.map((name, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: i === 0 ? Colors.danger[500] : i === 6 ? Colors.primary[500] : Colors.gray[500],
              }}
            >
              {name}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: "row", marginBottom: 4 }}>
          {week.map((day, di) => {
            const events = day ? scheduleDates.get(day) : undefined;
            const isToday = isCurrentMonth && day === todayDate;
            return (
              <View
                key={di}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 6,
                }}
              >
                {day !== null && (
                  <>
                    <View
                      style={[
                        {
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                        isToday && { backgroundColor: Colors.primary[500] },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: isToday
                            ? "#FFF"
                            : di === 0
                              ? Colors.danger[500]
                              : di === 6
                                ? Colors.primary[500]
                                : Colors.gray[900],
                          fontWeight: isToday ? "700" : "400",
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                    {events && (
                      <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                        {events.map((e) => (
                          <View
                            key={e.id}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 3,
                              backgroundColor:
                                e.type === "match" ? Colors.primary[500] : Colors.warm[400],
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>
      ))}

      <View style={{ flexDirection: "row", gap: 16, marginTop: 12, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary[500] }} />
          <Text style={{ fontSize: 12, color: Colors.gray[500] }}>경기</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.warm[400] }} />
          <Text style={{ fontSize: 12, color: Colors.gray[500] }}>훈련</Text>
        </View>
      </View>
    </Card>
  );
}
