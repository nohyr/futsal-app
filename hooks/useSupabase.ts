import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { posts as postsApi, schedules as schedulesApi, notices as noticesApi, records as recordsApi, teams as teamsApi } from "../lib/api";

/** 팀 정보 + 멤버 */
export function useTeam() {
  const { currentTeamId } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await teamsApi.get(currentTeamId);
      setTeam(data);
    } catch (e) { console.error("useTeam:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { team, loading, refresh };
}

/** 게시글 목록 */
export function usePosts() {
  const { currentTeamId } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await postsApi.list(currentTeamId);
      setPosts(data);
    } catch (e) { console.error("usePosts:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { posts, loading, refresh };
}

/** 일정 목록 */
export function useSchedules() {
  const { currentTeamId } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await schedulesApi.list(currentTeamId);
      setSchedules(data);
    } catch (e) { console.error("useSchedules:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { schedules, loading, refresh };
}

/** 공지 목록 */
export function useNotices() {
  const { currentTeamId } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await noticesApi.list(currentTeamId);
      setNotices(data);
    } catch (e) { console.error("useNotices:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { notices, loading, refresh };
}

/** 기록 목록 */
export function useRecords() {
  const { currentTeamId } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentTeamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await recordsApi.list(currentTeamId);
      setRecords(data);
    } catch (e) { console.error("useRecords:", e); }
    finally { setLoading(false); }
  }, [currentTeamId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { records, loading, refresh };
}
