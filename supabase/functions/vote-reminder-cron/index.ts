import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 오늘 이후 일정 중 미투표자가 있는 일정 조회
  const today = new Date().toISOString().slice(0, 10);
  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, team_id, date, time, type, opponent, description, attendances(user_id)")
    .gte("date", today);

  if (!schedules || schedules.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  let totalSent = 0;

  for (const schedule of schedules) {
    // 팀 멤버 조회
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", schedule.team_id);

    if (!members) continue;

    const votedIds = new Set((schedule.attendances || []).map((a: any) => a.user_id));
    const notVotedUserIds = members
      .map((m: any) => m.user_id)
      .filter((uid: string) => !votedIds.has(uid));

    if (notVotedUserIds.length === 0) continue;

    // push_token 조회
    const { data: users } = await supabase
      .from("users")
      .select("id, push_token")
      .in("id", notVotedUserIds)
      .not("push_token", "is", null);

    if (!users || users.length === 0) continue;

    const typeLabel = schedule.type === "match" ? "경기" : schedule.type === "training" ? "훈련" : "모임";
    const title = schedule.opponent ? `vs ${schedule.opponent}` : schedule.description || typeLabel;

    // DB 알림 저장
    const notifRecords = users.map((u: any) => ({
      user_id: u.id,
      type: "attendance_request",
      title: "참석 여부를 알려주세요",
      body: `${schedule.date} ${schedule.time} ${title} - 아직 투표하지 않았습니다`,
      data: { route: "/(tabs)/schedule" },
    }));
    await supabase.from("notifications").insert(notifRecords);

    // 푸시 발송
    const pushMessages = users.map((u: any) => ({
      to: u.push_token,
      sound: "default",
      title: "참석 여부를 알려주세요",
      body: `${schedule.date} ${schedule.time} ${title} - 아직 투표하지 않았습니다`,
      data: { route: "/(tabs)/schedule" },
    }));

    if (pushMessages.length > 0) {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pushMessages),
      });
      totalSent += pushMessages.length;
    }
  }

  return new Response(JSON.stringify({ sent: totalSent, timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
