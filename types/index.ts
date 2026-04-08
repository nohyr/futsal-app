export interface Player {
  id: string;
  name: string;
  number: number;
  position: "GK" | "FP";
  profileImage?: string;
  goals: number;
  assists: number;
  attendanceRate: number;
  role: "admin" | "member";
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  description: string;
  foundedDate: string;
  homeGround: string;
  memberCount: number;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  opponent: string;
  location: string;
  isHome: boolean;
  result?: {
    ourScore: number;
    theirScore: number;
  };
}

export interface Video {
  id: string;
  matchId?: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  type: "highlight" | "full";
  date: string;
  opponent?: string;
}

export interface Post {
  id: string;
  type: "video" | "record" | "feedback";
  title: string;
  content: string;
  author: Player;
  date: string;
  video?: Video;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

export interface Comment {
  id: string;
  author: Player;
  content: string;
  date: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: "general" | "location" | "fee" | "uniform" | "schedule";
  isPinned: boolean;
  isRead: boolean;
}

export interface Schedule {
  id: string;
  type: "match" | "training" | "gathering";
  date: string;
  time: string;
  location: string;
  opponent?: string;
  description?: string;
  attendance: AttendanceRecord[];
}

export interface AttendanceRecord {
  playerId: string;
  status: "attending" | "not_attending" | "maybe" | "pending";
}

export interface Record {
  id: string;
  type: "match" | "training";
  date: string;
  title: string;
  opponent?: string;
  result?: { ourScore: number; theirScore: number };
  location: string;
  memo?: string;
  videos: Video[];
  attendees: string[]; // player ids
}

export interface TeamStats {
  season: string;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
}
