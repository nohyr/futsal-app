import { View, Text } from "react-native";
import { Avatar } from "../ui/Avatar";
import { Colors } from "../../constants/colors";
import { Player } from "../../types";

interface PlayerStatCardProps {
  player: Player;
  rank: number;
  statType: "goals" | "assists" | "attendanceRate";
}

const statLabels = {
  goals: "골",
  assists: "어시스트",
  attendanceRate: "출석률",
};

export function PlayerStatCard({ player, rank, statType }: PlayerStatCardProps) {
  const value = player[statType];
  const displayValue = statType === "attendanceRate" ? `${value}%` : `${value}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
      }}
    >
      <Text
        style={{
          width: 28,
          fontSize: 16,
          fontWeight: "700",
          color: rank <= 3 ? Colors.primary[500] : Colors.gray[500],
          textAlign: "center",
        }}
      >
        {rank}
      </Text>

      <Avatar name={player.name} number={player.number} size={36} style={{ marginHorizontal: 12 }} />

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>
          {player.name}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.gray[500] }}>
          #{player.number} {player.position}
        </Text>
      </View>

      <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900] }}>
        {displayValue}
      </Text>
    </View>
  );
}
