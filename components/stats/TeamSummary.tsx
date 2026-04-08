import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { Colors } from "../../constants/colors";
import { TeamStats } from "../../types";

interface TeamSummaryProps {
  stats: TeamStats;
}

export function TeamSummary({ stats }: TeamSummaryProps) {
  const totalMatches = stats.wins + stats.draws + stats.losses;
  const winRate = totalMatches > 0 ? Math.round((stats.wins / totalMatches) * 100) : 0;

  return (
    <Card>
      <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>
        {stats.season}
      </Text>
      <Text style={{ fontSize: 13, color: Colors.gray[500], marginBottom: 20 }}>
        총 {totalMatches}경기
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
        <StatItem label="승" value={stats.wins} color={Colors.primary[500]} />
        <StatItem label="무" value={stats.draws} color={Colors.gray[500]} />
        <StatItem label="패" value={stats.losses} color={Colors.danger[500]} />
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: Colors.gray[100],
          flexDirection: "row",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flex: stats.wins,
            backgroundColor: Colors.primary[500],
          }}
        />
        <View
          style={{
            flex: stats.draws,
            backgroundColor: Colors.gray[300],
          }}
        />
        <View
          style={{
            flex: stats.losses,
            backgroundColor: Colors.danger[500],
          }}
        />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontSize: 12, color: Colors.gray[500] }}>승률</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: Colors.primary[500] }}>
            {winRate}%
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: Colors.gray[500] }}>득점</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: Colors.gray[900] }}>
            {stats.goalsScored}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, color: Colors.gray[500] }}>실점</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: Colors.gray[900] }}>
            {stats.goalsConceded}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "700", color }}>{value}</Text>
      <Text style={{ fontSize: 13, color: Colors.gray[500], marginTop: 2 }}>{label}</Text>
    </View>
  );
}
