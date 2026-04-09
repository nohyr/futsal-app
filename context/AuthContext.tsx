import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

interface User {
  id: string;
  name: string;
  profileImage: string | null;
}

interface TeamMembership {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
}

interface AuthContextType {
  isLoading: boolean;
  isLoggedIn: boolean;
  session: Session | null;
  user: User | null;
  teams: TeamMembership[];
  currentTeamId: string | null;
  setCurrentTeamId: (id: string | null) => void;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) syncAndLoadUser(s);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) syncAndLoadUser(s);
      else {
        setUser(null);
        setTeams([]);
        setCurrentTeamId(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /** 카카오 로그인 후 public.users에 프로필 동기화 + 로드 */
  const syncAndLoadUser = async (s: Session) => {
    try {
      const authUser = s.user;
      const kakaoMeta = authUser.user_metadata || {};
      const name = kakaoMeta.name || kakaoMeta.full_name || kakaoMeta.preferred_username || "풋살러";
      const rawImage = kakaoMeta.avatar_url || kakaoMeta.picture || null;
      const profileImage = rawImage ? rawImage.replace("http://", "https://") : null;

      // public.users에 upsert
      await supabase.from("users").upsert(
        {
          auth_id: authUser.id,
          kakao_id: authUser.id,
          name,
          profile_image: profileImage,
        },
        { onConflict: "auth_id" },
      );

      // 프로필 로드
      const { data: userData } = await supabase
        .from("users")
        .select("*, team_members(*, teams(*))")
        .eq("auth_id", authUser.id)
        .single();

      if (userData) {
        setUser({
          id: userData.id,
          name: userData.name,
          profileImage: userData.profile_image,
        });
        const memberTeams = (userData as any).team_members?.map((m: any) => ({
          id: m.id,
          teamId: m.teams?.id || m.team_id,
          teamName: m.teams?.name || "",
          role: m.role,
        })) || [];
        setTeams(memberTeams);
        if (memberTeams.length > 0 && !currentTeamId) {
          setCurrentTeamId(memberTeams[0].teamId);
        }
      }
    } catch (e) {
      console.error("syncAndLoadUser error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithKakao = async () => {
    await supabase.auth.signInWithOAuth({ provider: "kakao" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTeams([]);
    setCurrentTeamId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn: !!session && !!user,
        session,
        user,
        teams,
        currentTeamId,
        setCurrentTeamId,
        signInWithKakao,
        signOut,
        refreshUser: () => session ? syncAndLoadUser(session) : Promise.resolve(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
