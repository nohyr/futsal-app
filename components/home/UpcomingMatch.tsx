import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Colors } from "../../constants/colors";
import { Match } from "../../types";

interface UpcomingMatchProps {
  match: Match;
}

function getDDay(dateStr: string): string {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = days[date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
}

export function UpcomingMatch({ match }: UpcomingMatchProps) {
  const dDay = getDDay(match.date);

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Badge label={dDay} variant="primary" />
        <Badge label={match.isHome ? "홈" : "원정"} variant={match.isHome ? "success" : "neutral"} />
      </View>

      <Text style={{ fontSize: 24, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>
        vs {match.opponent}
      </Text>

      <View style={{ gap: 4, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14, color: Colors.gray[500] }}>
            {formatDate(match.date)} {match.time}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14, color: Colors.gray[500] }}>{match.location}</Text>
        </View>
      </View>

      <Button title="출석 투표하기" variant="primary" />
    </Card>
  );
}
