import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Colors } from "../../constants/colors";
import { Schedule } from "../../types";

interface WeekSchedulePreviewProps {
  schedules: Schedule[];
}

const typeConfig = {
  match: { label: "경기", variant: "primary" as const },
  training: { label: "훈련", variant: "neutral" as const },
  gathering: { label: "모임", variant: "warning" as const },
};

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
}

export function WeekSchedulePreview({ schedules }: WeekSchedulePreviewProps) {
  if (schedules.length === 0) {
    return (
      <Card>
        <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", paddingVertical: 12 }}>
          이번 주 일정이 없습니다
        </Text>
      </Card>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {schedules.map((schedule) => {
        const config = typeConfig[schedule.type];
        const attendingCount = schedule.attendance.filter((a) => a.status === "attending").length;

        return (
          <Card key={schedule.id}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Badge label={config.label} variant={config.variant} />
                  <Text style={{ fontSize: 13, color: Colors.gray[500] }}>
                    {formatShortDate(schedule.date)} {schedule.time}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.gray[900] }}>
                  {schedule.opponent ? `vs ${schedule.opponent}` : schedule.description}
                </Text>
                <Text style={{ fontSize: 13, color: Colors.gray[500] }}>{schedule.location}</Text>
              </View>

              {schedule.attendance.length > 0 && (
                <View style={{ alignItems: "center", marginLeft: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.primary[500] }}>
                    {attendingCount}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.gray[500] }}>참석</Text>
                </View>
              )}
            </View>
          </Card>
        );
      })}
    </View>
  );
}
