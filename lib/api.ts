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
    const { data } = await supabase
      .from("schedules")
      .insert({ ...schedule, team_id: teamId })
      .select()
      .single();
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
};

// =============================================
// Notices
// =============================================
export const notices = {
  async list(teamId: string) {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .eq("team_id", teamId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    return data || [];
  },

  async create(teamId: string, notice: { title: string; content: string; category?: string; is_pinned?: boolean }) {
    const userId = (await auth.getUser())?.id;
    if (!userId) throw new Error("Not authenticated");

    const { data } = await supabase
      .from("notices")
      .insert({ ...notice, team_id: teamId, author_id: userId })
      .select()
      .single();
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
};

// =============================================
// Records
// =============================================
export const records = {
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
