/**
 * Supabase Edge Function 참고 코드
 *
 * 배포 방법:
 *   supabase functions deploy send-push
 *
 * 호출 방법:
 *   POST /functions/v1/send-push
 *   Body: { team_id, type, title, body, data?, exclude_user_id? }
 *
 * 이 파일은 참고용입니다. 현재 알림 발송은 클라이언트(lib/api.ts)에서
 * 직접 Expo Push API를 호출합니다.
 * 프로덕션에서는 이 Edge Function으로 전환하는 것을 권장합니다.
 */

// Deno용 코드 (Supabase Edge Functions는 Deno 런타임)
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  const { team_id, type, title, body, data = {}, exclude_user_id } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 팀원 push_token 조회
  const { data: tokens } = await supabase.rpc("get_team_push_tokens", {
    p_team_id: team_id,
    p_exclude_user_id: exclude_user_id || null,
  });

  if (!tokens || tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // DB에 알림 레코드 저장
  const notifRecords = tokens.map((t: any) => ({
    user_id: t.user_id,
    type,
    title,
    body,
    data,
  }));
  await supabase.from("notifications").insert(notifRecords);

  // Expo Push API 호출
  const messages = tokens
    .filter((t: any) => t.push_token)
    .map((t: any) => ({
      to: t.push_token,
      sound: "default",
      title,
      body,
      data,
    }));

  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  let totalSent = 0;
  for (const chunk of chunks) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });
    if (res.ok) totalSent += chunk.length;
  }

  return new Response(JSON.stringify({ sent: totalSent }), { status: 200 });
});
*/
