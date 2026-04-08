import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTeam } from "../../hooks/useSupabase";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";

export default function TeamScreen() {
  const { team, loading } = useTeam();

  const members = team?.team_members || [];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.gray[50] }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Team Info Card */}
      <Card>
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: Colors.primary[50], alignItems: "center", justifyContent: "center", marginBottom: 12,
          }}>
            <Ionicons name="shield" size={32} color={Colors.primary[500]} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: Colors.gray[900], marginBottom: 4 }}>
            {team?.name || "팀"}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.gray[500], textAlign: "center", marginBottom: 16 }}>
            {team?.description || ""}
          </Text>
          <View style={{ flexDirection: "row", gap: 24 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900] }}>{members.length}</Text>
              <Text style={{ fontSize: 12, color: Colors.gray[500] }}>멤버</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900] }}>{team?.founded_date?.slice(0, 4) || "-"}</Text>
              <Text style={{ fontSize: 12, color: Colors.gray[500] }}>창단</Text>
            </View>
            {team?.home_ground ? (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="location-outline" size={20} color={Colors.gray[900]} />
                <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{team.home_ground}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>

      {/* Invite Code */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 13, color: Colors.gray[500], marginBottom: 4 }}>초대 코드</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.primary[500], letterSpacing: 2 }}>
              {team?.invite_code || ""}
            </Text>
          </View>
          <Ionicons name="copy-outline" size={22} color={Colors.gray[500]} />
        </View>
      </Card>

      {/* Members List */}
      <View>
        <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.gray[900], marginBottom: 12 }}>
          팀원 ({members.length})
        </Text>
        <Card>
          {members.map((member: any, index: number) => (
            <View
              key={member.id}
              style={{
                flexDirection: "row", alignItems: "center", paddingVertical: 12,
                borderBottomWidth: index < members.length - 1 ? 1 : 0, borderBottomColor: Colors.gray[100],
              }}
            >
              <Avatar name={member.users?.name || "?"} imageUrl={member.users?.profile_image} number={member.number || undefined} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.gray[900] }}>{member.users?.name || "멤버"}</Text>
                  {member.role === "admin" && <Badge label="운영진" variant="primary" />}
                </View>
                <Text style={{ fontSize: 13, color: Colors.gray[500] }}>
                  #{member.number || 0} {member.position === "GK" ? "골키퍼" : "필드"}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
