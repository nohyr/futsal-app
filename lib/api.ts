import { supabase } from "./supabase";

// =============================================
// Auth
// =============================================
export const auth = {
  async signInWithKakao() {
    return supabase.auth.signInWithOAuth({
      provider: "kakao",
    });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("users")
      .select("*, team_members(*, teams(*))")
      .eq("auth_id", user.id)
      .single();
    return data;
  },

  /** Supabase Auth 후 public.users에 프로필 동기화 */
  async syncProfile(authId: string, name: string, profileImage: string | null) {
    return supabase.from("users").upsert(
      { auth_id: authId, name, profile_image: profileImage, kakao_id: authId },
      { onConflict: "auth_id" },
    );
  },
};

// =============================================
// Teams
// =============================================
export const teams = {
  async create(name: string, description: string) {
    const userId = (await auth.getUser())?.id;
    if (!userId) throw new Error("Not authenticated");

    const inviteCode = Math.random().toString(36).slice(2, 10).toUpperCase();

    const { data: team, error } = await supabase
      .from("teams")
      .insert({ name, description, invite_code: inviteCode })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("team_members").insert({
      user_id: userId,
      team_id: team.id,
      role: "admin",
    });

    return team;
  },

  async join(inviteCode: string) {
    const userId = (await auth.getUser())?.id;
    if (!userId) throw new Error("Not authenticated");

    const { data: team } = await supabase
      .from("teams")
      .select()
      .eq("invite_code", inviteCode)
      .single();

    if (!team) throw new Error("유효하지 않은 초대 코드입니다");

    await supabase.from("team_members").insert({
      user_id: userId,
      team_id: team.id,
    });

    return team;
  },

  async get(teamId: string) {
    const { data } = await supabase
      .from("teams")
      .select("*, team_members(*, users(*))")
      .eq("id", teamId)
      .single();
    return data;
  },
};

// =============================================
// Posts
// =============================================
export const posts = {
  async list(teamId: string, limit = 20) {
    const { data } = await supabase
      .from("posts")
      .select("*, users!author_id(*), comments(*, users!author_id(*)), likes(*)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  },

  async create(teamId: string, post: { type: string; title: string; content: string; video_url?: string; thumbnail_url?: string; video_duration?: string }) {
    const userId = (await auth.getUser())?.id;
    if (!userId) throw new Error("Not authenticated");

    const { data } = await supabase
      .from("posts")
      .insert({ ...post, team_id: teamId, author_id: userId })
      .select("*, users!author_id(*)")
      .single();

    // 알림: 팀원에게 새 게시글 알림
    if (data) {
      const authorName = data.users?.name || "팀원";
      notifications.sendToTeam(teamId, "new_post", "새 게시글", `${authorName}님이 "${post.title}" 게시글을 올렸습니다`, { route: `/post/${data.id}` }, userId);
    }

    return data;
  },

  async toggleLike(postId: string) {
    const userId = (await auth.getUser())?.id;
    if (!userId) throw new Error("Not authenticated");

    const { data: existing } = await supabase
      .from("likes")
      .select()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: userId });

      // 알림: 게시글 작성자에게 좋아요 알림
      const { data: post } = await supabase.from("posts").select("author_id, title").eq("id", postId).single();
      if (post && post.author_id !== userId) {
        const { data: liker } = await supabase.from("users").select("name").eq("id", userId).single();
        notifications.sendToUser(post.author_id, "new_like", "좋아요", `${liker?.name || "팀원"}님이 "${post.title}" 게시글을 좋아합니다`, { route: `/post/${postId}` });
      }

      return true;
    }
  },

  async addComment(postId: string, content: string) {
    const userId = (await auth.getUser())?.id;
    if (!userId) throw new Error("Not authenticated");

    const { data } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: userId, content })
      .select("*, users!author_id(*)")
      .single();

    // 알림: 게시글 작성자에게 댓글 알림
    if (data) {
      const { data: post } = await supabase.from("posts").select("author_id, title").eq("id", postId).single();
      if (post && post.author_id !== userId) {
        const commenterName = data.users?.name || "팀원";
        notifications.sendToUser(post.author_id, "new_comment", "새 댓글", `${commenterName}님이 "${post.title}"에 댓글을 남겼습니다`, { route: `/post/${postId}` });
      }
    }

    return data;
  },

  async delete(postId: string) {
    return supabase.from("posts").delete().eq("id", postId);
  },
};

// =============================================
// Schedules
// =============================================
export const schedules = {
  async list(teamId: string) {
    const { data } = await supabase
      .from("schedules")
      .select("*, attendances(*, users(*))")
      .eq("team_id", teamId)
      .order("date", { ascending: true });
    return data || [];
  },

  async create(teamId: string, schedule: { type: string; date: string; time: string; location: string; opponent?: string; description?: string }) {
    const userId = (await auth.getUser())?.id;
    const { data } = await supabase
      .from("schedules")
      .insert({ ...schedule, team_id: teamId })
      .select()
      .single();

    // 알림: 팀원에게 새 일정 알림
    if (data) {
      const typeLabel = schedule.type === "match" ? "경기" : schedule.type === "training" ? "훈련" : "모임";
      const title = schedule.opponent ? `vs ${schedule.opponent}` : schedule.description || typeLabel;
      notifications.sendToTeam(teamId, "new_schedule", "새 일정", `${schedule.date} ${schedule.time} ${title}`, { route: "/(tabs)/schedule" }, userId || undefined);
    }

    return data;
  },

  async vote(scheduleId: string, status: string) {
    const userId = (await auth.getUser())?.id;
    if (!userId) throw new Error("Not authenticated");

    const { data } = await supabase
      .from("attendances")
      .upsert(
        { schedule_id: scheduleId, user_id: userId, status, updated_at: new Date().toISOString() },
        { onConflict: "schedule_id,user_id" },
      )
      .select()
      .single();
    return data;
  },

  async delete(scheduleId: string) {
    return supabase.from("schedules").delete().eq("id", scheduleId);
  },

  /** 미투표자에게 알림 발송 */
  async sendVoteReminder(scheduleId: string, teamId: string) {
    // 일정 정보 조회
    const { data: schedule } = await supabase
      .from("schedules")
      .select("*, attendances(user_id)")
      .eq("id", scheduleId)
      .single();

    if (!schedule) return;

    // 팀 멤버 조회
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    if (!members) return;

    // 투표한 유저 ID
    const votedIds = new Set((schedule.attendances || []).map((a: any) => a.user_id));

    // 미투표자 필터
    const notVotedUserIds = members
      .map((m: any) => m.user_id)
      .filter((uid: string) => !votedIds.has(uid));

    if (notVotedUserIds.length === 0) return 0;

    // 일정 제목 생성
    const typeLabel = schedule.type === "match" ? "경기" : schedule.type === "training" ? "훈련" : "모임";
    const title = schedule.opponent ? `vs ${schedule.opponent}` : schedule.description || typeLabel;

    // 각 미투표자에게 알림 발송
    for (const userId of notVotedUserIds) {
      await notifications.sendToUser(
        userId,
        "attendance_request",
        "참석 여부를 알려주세요",
        `${schedule.date} ${schedule.time} ${title} - 아직 투표하지 않았습니다`,
        { route: "/(tabs)/schedule" },
      );
    }

    return notVotedUserIds.length;
  },

  /** admin: 특정 멤버 출석 체크 */
  async checkIn(scheduleId: string, userId: string) {
    const { data } = await supabase
      .from("attendances")
      .update({ checked_in: true, checked_in_at: new Date().toISOString(), is_no_show: false })
      .eq("schedule_id", scheduleId)
      .eq("user_id", userId)
      .select()
      .single();
    return data;
  },

  /** admin: no-show 처리 */
  async markNoShow(scheduleId: string, userId: string) {
    const { data } = await supabase
      .from("attendances")
      .update({ checked_in: false, is_no_show: true })
      .eq("schedule_id", scheduleId)
      .eq("user_id", userId)
      .select()
      .single();
    return data;
  },

  /** admin: 일괄 출석 체크 */
  async bulkCheckIn(scheduleId: string, checkedInUserIds: string[], allUserIds: string[]) {
    const now = new Date().toISOString();
    const updates = allUserIds.map((uid) => {
      const isCheckedIn = checkedInUserIds.includes(uid);
      return supabase
        .from("attendances")
        .upsert(
          {
            schedule_id: scheduleId,
            user_id: uid,
            checked_in: isCheckedIn,
            checked_in_at: isCheckedIn ? now : null,
            is_no_show: !isCheckedIn,
            status: isCheckedIn ? "attending" : "not_attending",
            updated_at: now,
          },
          { onConflict: "schedule_id,user_id" },
        );
    });
    await Promise.all(updates);
  },

  /** 멤버별 출석률 통계 */
  async getAttendanceStats(teamId: string) {
    const { data } = await supabase.rpc("get_attendance_stats", { p_team_id: teamId });
    return data || [];
  },
};

// =============================================
// Notices
// =============================================
export const notices = {
  /** 공지 목록 + 읽음 상태 포함 */
  async list(teamId: string) {
    const userId = (await auth.getUser())?.id;
    const { data } = await supabase
      .from("notices")
      .select("*, notice_reads(user_id)")
      .eq("team_id", teamId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    return (data || []).map((n: any) => ({
      ...n,
      is_read: (n.notice_reads || []).some((r: any) => r.user_id === userId),
      read_count: (n.notice_reads || []).length,
    }));
  },

  async create(teamId: string, notice: { title: string; content: string; category?: string; is_pinned?: boolean }) {
    const userId = (await auth.getUser())?.id;
    if (!userId) throw new Error("Not authenticated");

    const { data } = await supabase
      .from("notices")
      .insert({ ...notice, team_id: teamId, author_id: userId })
      .select()
      .single();

    // 알림: 팀원에게 새 공지 알림
    if (data) {
      notifications.sendToTeam(teamId, "new_notice", "새 공지", notice.title, { route: "/(tabs)/notice" }, userId);
    }

    return data;
  },

  async update(noticeId: string, updates: { title?: string; content?: string; category?: string; is_pinned?: boolean }) {
    const { data } = await supabase
      .from("notices")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", noticeId)
      .select()
      .single();
    return data;
  },

  async delete(noticeId: string) {
    return supabase.from("notices").delete().eq("id", noticeId);
  },

  /** 공지 읽음 처리 */
  async markAsRead(noticeId: string) {
    const userId = (await auth.getUser())?.id;
    if (!userId) return;
    await supabase
      .from("notice_reads")
      .upsert({ notice_id: noticeId, user_id: userId }, { onConflict: "notice_id,user_id" });
  },

  /** 미읽음 공지 개수 */
  async getUnreadCount(teamId: string): Promise<number> {
    const userId = (await auth.getUser())?.id;
    if (!userId) return 0;
    const { data: allNotices } = await supabase
      .from("notices")
      .select("id")
      .eq("team_id", teamId);
    const { data: reads } = await supabase
      .from("notice_reads")
      .select("notice_id")
      .eq("user_id", userId);
    const readIds = new Set((reads || []).map((r: any) => r.notice_id));
    return (allNotices || []).filter((n: any) => !readIds.has(n.id)).length;
  },

  /** 공지별 읽음 통계 (관리자용) */
  async getReadStats(noticeId: string) {
    const { data } = await supabase.rpc("get_notice_read_stats", { p_notice_id: noticeId });
    return data?.[0] || { total_members: 0, read_count: 0, read_rate: 0, unread_users: [] };
  },
};

// =============================================
// Records
// =============================================
export const records = {
  /** 팀 전적 통계 */
  async getTeamStats(teamId: string) {
    const { data } = await supabase.rpc("get_team_match_stats", { p_team_id: teamId });
    return data?.[0] || null;
  },

  async list(teamId: string) {
    const { data } = await supabase
      .from("records")
      .select("*")
      .eq("team_id", teamId)
      .order("date", { ascending: false });
    return data || [];
  },

  async create(teamId: string, record: { type: string; title: string; date: string; location: string; opponent?: string; our_score?: number; their_score?: number; memo?: string }) {
    const { data } = await supabase
      .from("records")
      .insert({ ...record, team_id: teamId })
      .select()
      .single();
    return data;
  },

  async update(recordId: string, updates: Record<string, any>) {
    const { data } = await supabase
      .from("records")
      .update(updates)
      .eq("id", recordId)
      .select()
      .single();
    return data;
  },

  async delete(recordId: string) {
    return supabase.from("records").delete().eq("id", recordId);
  },
};

// =============================================
// Fee Ledger (회비 장부)
// =============================================
export const feeLedger = {
  /** 회비 목록 + 납부 상태 포함 */
  async list(teamId: string) {
    const { data } = await supabase
      .from("fee_items")
      .select("*, fee_payments(*, users(id, name, profile_image))")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    return (data || []).map((item: any) => {
      const payments = item.fee_payments || [];
      const paidCount = payments.filter((p: any) => p.is_paid).length;
      return { ...item, payments, paid_count: paidCount, total_count: payments.length };
    });
  },

  /** 회비 항목 생성 + 팀원 전체에 payment 레코드 자동 생성 */
  async create(teamId: string, fee: { name: string; amount: number; category?: string; month?: string; description?: string }) {
    // 항목 생성
    const { data: item, error } = await supabase
      .from("fee_items")
      .insert({ ...fee, team_id: teamId })
      .select()
      .single();

    if (error || !item) throw error || new Error("회비 항목 생성 실패");

    // 팀원 전체에 payment 레코드 생성
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    if (members && members.length > 0) {
      const paymentRecords = members.map((m: any) => ({
        fee_item_id: item.id,
        user_id: m.user_id,
        is_paid: false,
      }));
      await supabase.from("fee_payments").insert(paymentRecords);
    }

    // 알림: 팀원에게 새 회비 알림
    const userId = (await auth.getUser())?.id;
    notifications.sendToTeam(
      teamId, "new_notice", "새 회비",
      `${fee.name} ${fee.amount.toLocaleString()}원`,
      { route: "/(tabs)/records" },
      userId || undefined,
    );

    return item;
  },

  /** 회비 항목 삭제 */
  async delete(feeId: string) {
    return supabase.from("fee_items").delete().eq("id", feeId);
  },

  /** 납부 처리 */
  async markPaid(feeItemId: string, userId: string) {
    return supabase
      .from("fee_payments")
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq("fee_item_id", feeItemId)
      .eq("user_id", userId);
  },

  /** 납부 취소 */
  async markUnpaid(feeItemId: string, userId: string) {
    return supabase
      .from("fee_payments")
      .update({ is_paid: false, paid_at: null })
      .eq("fee_item_id", feeItemId)
      .eq("user_id", userId);
  },

  /** 월별 요약 */
  async getMonthlySummary(teamId: string, month: string | null) {
    const { data } = await supabase.rpc("get_monthly_fee_summary", {
      p_team_id: teamId,
      p_month: month,
    });
    return data?.[0] || { total_amount: 0, paid_amount: 0, unpaid_amount: 0, payment_rate: 0 };
  },

  /** 미납자 목록 */
  async getUnpaidMembers(feeItemId: string) {
    const { data } = await supabase
      .from("fee_payments")
      .select("*, users(id, name, profile_image)")
      .eq("fee_item_id", feeItemId)
      .eq("is_paid", false);
    return data || [];
  },

  /** 미납자 푸시 알림 */
  async sendUnpaidReminder(teamId: string, feeItemId: string) {
    const unpaid = await feeLedger.getUnpaidMembers(feeItemId);
    const { data: feeItem } = await supabase
      .from("fee_items")
      .select("name, amount")
      .eq("id", feeItemId)
      .single();

    for (const p of unpaid) {
      notifications.sendToUser(
        p.user_id,
        "new_notice",
        "회비 납부 안내",
        `${feeItem?.name || "회비"} ${feeItem?.amount?.toLocaleString() || ""}원 미납입니다`,
        { route: "/(tabs)/records" },
      );
    }
  },
};

// =============================================
// Expenses (지출 내역)
// =============================================
export const expenses = {
  /** 지출 목록 */
  async list(teamId: string, month?: string) {
    let query = supabase
      .from("expenses")
      .select("*, users:created_by(name, profile_image)")
      .eq("team_id", teamId)
      .order("date", { ascending: false });
    if (month) query = query.eq("month", month);
    const { data } = await query;
    return data || [];
  },

  /** 지출 등록 */
  async create(teamId: string, expense: { name: string; amount: number; category?: string; month?: string; date?: string; description?: string }) {
    const userId = (await auth.getUser())?.id;
    const { data } = await supabase
      .from("expenses")
      .insert({ ...expense, team_id: teamId, created_by: userId })
      .select()
      .single();
    return data;
  },

  /** 지출 삭제 */
  async delete(expenseId: string) {
    return supabase.from("expenses").delete().eq("id", expenseId);
  },
};

// =============================================
// Notifications
// =============================================
export const notifications = {
  /** 내 알림 목록 */
  async list(limit = 30) {
    const userId = (await auth.getUser())?.id;
    if (!userId) return [];
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  },

  /** 읽음 처리 */
  async markRead(notificationId: string) {
    return supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  },

  /** 전체 읽음 */
  async markAllRead() {
    const userId = (await auth.getUser())?.id;
    if (!userId) return;
    return supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  },

  /** 푸시 토큰 등록 */
  async registerToken(token: string) {
    const userId = (await auth.getUser())?.id;
    if (!userId) return;
    return supabase
      .from("users")
      .update({ push_token: token })
      .eq("id", userId);
  },

  /** 팀원들에게 알림 발송 + DB 저장 */
  async sendToTeam(
    teamId: string,
    type: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
    excludeUserId?: string,
  ) {
    try {
      // 1. 팀원들의 push_token 조회
      const { data: tokens } = await supabase.rpc("get_team_push_tokens", {
        p_team_id: teamId,
        p_exclude_user_id: excludeUserId || null,
      });

      if (!tokens || tokens.length === 0) return;

      // 2. DB에 알림 레코드 저장
      const notifRecords = tokens.map((t: any) => ({
        user_id: t.user_id,
        type,
        title,
        body,
        data,
      }));
      await supabase.from("notifications").insert(notifRecords);

      // 3. Expo Push API로 발송
      const pushMessages = tokens
        .filter((t: any) => t.push_token)
        .map((t: any) => ({
          to: t.push_token,
          sound: "default",
          title,
          body,
          data,
        }));

      if (pushMessages.length > 0) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(pushMessages),
        });
      }
    } catch (e) {
      console.error("sendToTeam notification error:", e);
    }
  },

  /** 특정 사용자에게 알림 발송 */
  async sendToUser(
    userId: string,
    type: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ) {
    try {
      // DB 저장
      await supabase.from("notifications").insert({
        user_id: userId,
        type,
        title,
        body,
        data,
      });

      // push_token 조회 + 발송
      const { data: user } = await supabase
        .from("users")
        .select("push_token")
        .eq("id", userId)
        .single();

      if (user?.push_token) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            to: user.push_token,
            sound: "default",
            title,
            body,
            data,
          }),
        });
      }
    } catch (e) {
      console.error("sendToUser notification error:", e);
    }
  },
};

// =============================================
// Storage (영상/이미지 업로드)
// =============================================
export const storage = {
  async uploadVideo(filePath: string, file: Blob) {
    const { data, error } = await supabase.storage
      .from("media")
      .upload(filePath, file, { contentType: "video/mp4" });
    if (error) throw error;
    return supabase.storage.from("media").getPublicUrl(data.path).data.publicUrl;
  },

  async uploadImage(filePath: string, file: Blob) {
    const { data, error } = await supabase.storage
      .from("media")
      .upload(filePath, file, { contentType: "image/jpeg" });
    if (error) throw error;
    return supabase.storage.from("media").getPublicUrl(data.path).data.publicUrl;
  },
};
