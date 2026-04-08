import { useState, useEffect, useCallback } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { posts as postsApi, schedules as schedulesApi, notices as noticesApi, records as recordsApi, teams as teamsApi } from "../lib/api";

export interface AttendanceStat {
  user_id: string;
  user_name: string;
  profile_image: string | null;
  total_events: number;
  attended: number;
  no_shows: number;
  attendance_rate: number;
}

/** 팀 정보 + 멤버 */
export function useTeam() {
  const { currentTeamId } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await teamsApi.get(currentTeamId);
      setTeam(data);
    } catch (e) { console.error("useTeam:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { if (isFocused) refresh(); }, [refresh, isFocused]);
  return { team, loading, refresh };
}

/** 게시글 목록 */
export function usePosts() {
  const { currentTeamId } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await postsApi.list(currentTeamId);
      setPosts(data);
    } catch (e) { console.error("usePosts:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { if (isFocused) refresh(); }, [refresh, isFocused]);
  return { posts, loading, refresh };
}

/** 일정 목록 */
export function useSchedules() {
  const { currentTeamId } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await schedulesApi.list(currentTeamId);
      setSchedules(data);
    } catch (e) { console.error("useSchedules:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { if (isFocused) refresh(); }, [refresh, isFocused]);
  return { schedules, loading, refresh };
}

/** 공지 목록 */
export function useNotices() {
  const { currentTeamId } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await noticesApi.list(currentTeamId);
      setNotices(data);
    } catch (e) { console.error("useNotices:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { if (isFocused) refresh(); }, [refresh, isFocused]);
  return { notices, loading, refresh };
}

/** 기록 목록 */
export function useRecords() {
  const { currentTeamId } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await recordsApi.list(currentTeamId);
      setRecords(data);
    } catch (e) { console.error("useRecords:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { if (isFocused) refresh(); }, [refresh, isFocused]);
  return { records, loading, refresh };
}

/** 멤버별 출석률 통계 */
export function useAttendanceStats() {
  const { currentTeamId } = useAuth();
  const [stats, setStats] = useState<AttendanceStat[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await schedulesApi.getAttendanceStats(currentTeamId);
      setStats(data as AttendanceStat[]);
    } catch (e) { console.error("useAttendanceStats:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { if (isFocused) refresh(); }, [refresh, isFocused]);
  return { stats, loading, refresh };
}
