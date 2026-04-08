import { View, Text, Pressable } from "react-native";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { Colors } from "../../constants/colors";
import { Schedule } from "../../types";
import { players } from "../../constants/mock-data";

interface AttendanceCardProps {
  schedule: Schedule;
}

const statusConfig = {
  attending: { label: "참석", variant: "success" as const, color: Colors.success[500] },
  not_attending: { label: "불참", variant: "danger" as const, color: Colors.danger[500] },
  maybe: { label: "미정", variant: "warning" as const, color: Colors.warning[500] },
  pending: { label: "미응답", variant: "neutral" as const, color: Colors.gray[500] },
};

export function AttendanceCard({ schedule }: AttendanceCardProps) {
  const attendingCount = schedule.attendance.filter((a) => a.status === "attending").length;
  const totalCount = players.length;

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Badge
          label={schedule.type === "match" ? "경기" : "훈련"}
          variant={schedule.type === "match" ? "primary" : "neutral"}
        />
        <Text style={{ fontSize: 14, color: Colors.gray[500] }}>
          {schedule.date} {schedule.time}
        </Text>
      </View>

      <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.gray[900], marginBottom: 4 }}>
        {schedule.opponent ? `vs ${schedule.opponent}` : schedule.description}
      </Text>
      <Text style={{ fontSize: 13, color: Colors.gray[500], marginBottom: 16 }}>
        {schedule.location}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: Colors.gray[50],
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 14, color: Colors.gray[700] }}>참석 현황</Text>
        <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.primary[500] }}>
          {attendingCount}/{totalCount}
        </Text>
      </View>

      {schedule.attendance.length > 0 && (
        <View style={{ gap: 8 }}>
          {schedule.attendance.map((record) => {
            const player = players.find((p) => p.id === record.playerId);
            if (!player) return null;
            const status = statusConfig[record.status];
            return (
              <View
                key={record.playerId}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Avatar name={player.name} number={player.number} size={32} />
                  <Text style={{ fontSize: 14, color: Colors.gray[900] }}>{player.name}</Text>
                </View>
                <Badge label={status.label} variant={status.variant} />
              </View>
            );
          })}
        </View>
      )}

      {schedule.attendance.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ fontSize: 14, color: Colors.gray[500] }}>아직 투표가 시작되지 않았습니다</Text>
        </View>
      )}
    </Card>
  );
}
