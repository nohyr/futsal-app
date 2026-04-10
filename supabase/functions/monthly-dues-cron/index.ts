import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // action 파라미터로 구분: "create" (24일) / "remind" (말일+)
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "create";

  const now = new Date();
  // 다음 달 회비 월 계산 (24일에 생성하므로 다음 달 기준)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  // 이번 달 (말일 미납 알림용)
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 모든 팀 조회
  const { data: teams } = await supabase.from("teams").select("id, name");
  if (!teams || teams.length === 0) {
    return jsonResponse({ action, processed: 0 });
  }

  let totalProcessed = 0;

  for (const team of teams) {
    if (action === "create") {
      // ===== 매월 24일: 다음 달 회비 자동 생성 =====

      // 이미 생성된 회비가 있는지 확인
      const { data: existing } = await supabase
        .from("fee_items")
        .select("id")
        .eq("team_id", team.id)
        .eq("month", monthStr)
        .eq("category", "monthly")
        .limit(1);

      if (existing && existing.length > 0) continue; // 이미 있으면 스킵

      // 회비 금액 조회 (가장 최근 월회비 기준)
      const { data: lastFee } = await supabase
        .from("fee_items")
        .select("amount")
        .eq("team_id", team.id)
        .eq("category", "monthly")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const amount = lastFee?.amount || 30000; // 기본 3만원

      // 회비 항목 생성
      const monthLabel = `${nextMonth.getMonth() + 1}월`;
      const { data: feeItem } = await supabase
        .from("fee_items")
        .insert({
          team_id: team.id,
          name: `${monthLabel} 회비`,
          amount,
          category: "monthly",
          month: monthStr,
        })
        .select()
        .single();

      if (!feeItem) continue;

      // 팀원 전체에 미납 레코드 생성
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id);

      if (members && members.length > 0) {
        const paymentRecords = members.map((m: any) => ({
          fee_item_id: feeItem.id,
          user_id: m.user_id,
          is_paid: false,
        }));
        await supabase.from("fee_payments").insert(paymentRecords);

        // 팀원 전체에 알림
        await sendTeamNotification(
          supabase,
          team.id,
          "새 회비",
          `${monthLabel} 회비 ${Number(amount).toLocaleString()}원이 등록되었습니다. 말일까지 납부해주세요.`,
        );

        totalProcessed += members.length;
      }

    } else if (action === "remind") {
      // ===== 말일 이후: 미납자 알림 =====

      // 이번 달 월회비 조회
      const { data: feeItems } = await supabase
        .from("fee_items")
        .select("id, name, amount")
        .eq("team_id", team.id)
        .eq("month", currentMonthStr)
        .eq("category", "monthly");

      if (!feeItems || feeItems.length === 0) continue;

      for (const fee of feeItems) {
        // 미납자 조회
        const { data: unpaid } = await supabase
          .from("fee_payments")
          .select("user_id, users(push_token)")
          .eq("fee_item_id", fee.id)
          .eq("is_paid", false);

        if (!unpaid || unpaid.length === 0) continue;

        // 미납자에게 개별 알림
        for (const p of unpaid) {
          await supabase.from("notifications").insert({
            user_id: p.user_id,
            type: "new_notice",
            title: "회비 미납 안내",
            body: `${fee.name} ${Number(fee.amount).toLocaleString()}원이 미납입니다. 빠른 납부 부탁드립니다.`,
            data: { route: "/(tabs)/records" },
          });

          const pushToken = (p as any).users?.push_token;
          if (pushToken) {
            await fetch(EXPO_PUSH_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: pushToken,
                sound: "default",
                title: "회비 미납 안내",
                body: `${fee.name} ${Number(fee.amount).toLocaleString()}원이 미납입니다.`,
                data: { route: "/(tabs)/records" },
              }),
            });
          }
        }

        totalProcessed += unpaid.length;
      }
    }
  }

  return jsonResponse({ action, processed: totalProcessed, timestamp: new Date().toISOString() });
});

// 팀 전체에 알림 발송
async function sendTeamNotification(supabase: any, teamId: string, title: string, body: string) {
  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, users(push_token)")
    .eq("team_id", teamId);

  if (!members) return;

  const notifRecords = members.map((m: any) => ({
    user_id: m.user_id,
    type: "new_notice",
    title,
    body,
    data: { route: "/(tabs)/records" },
  }));
  await supabase.from("notifications").insert(notifRecords);

  const pushMessages = members
    .filter((m: any) => m.users?.push_token)
    .map((m: any) => ({
      to: m.users.push_token,
      sound: "default",
      title,
      body,
      data: { route: "/(tabs)/records" },
    }));

  if (pushMessages.length > 0) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pushMessages),
    });
  }
}

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
