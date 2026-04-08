import { Player, Team, Match, Video, Post, Announcement, Schedule, Record, TeamStats, Comment } from "../types";

export const currentPlayer: Player = {
  id: "1", name: "김민수", number: 10, position: "FP",
  goals: 12, assists: 8, attendanceRate: 92, role: "admin",
};

export const players: Player[] = [
  currentPlayer,
  { id: "2", name: "이준호", number: 7, position: "FP", goals: 9, assists: 5, attendanceRate: 88, role: "member" },
  { id: "3", name: "박서진", number: 1, position: "GK", goals: 0, assists: 1, attendanceRate: 95, role: "member" },
  { id: "4", name: "최동현", number: 9, position: "FP", goals: 7, assists: 11, attendanceRate: 85, role: "member" },
  { id: "5", name: "정우성", number: 5, position: "FP", goals: 3, assists: 4, attendanceRate: 78, role: "member" },
  { id: "6", name: "한지훈", number: 8, position: "FP", goals: 5, assists: 6, attendanceRate: 90, role: "admin" },
  { id: "7", name: "송태양", number: 11, position: "FP", goals: 8, assists: 3, attendanceRate: 82, role: "member" },
  { id: "8", name: "윤재혁", number: 3, position: "FP", goals: 2, assists: 7, attendanceRate: 91, role: "member" },
];

export const team: Team = {
  id: "t1",
  name: "FC 브레이브",
  description: "2023년 창단, 매주 수요일 훈련 / 격주 토요일 경기",
  foundedDate: "2023-03-01",
  homeGround: "강남 풋살장",
  memberCount: 8,
};

export const matches: Match[] = [
  { id: "m1", date: "2026-04-12", time: "14:00", opponent: "FC 썬더", location: "강남 풋살장", isHome: true },
  { id: "m2", date: "2026-04-05", time: "16:00", opponent: "유나이티드 FC", location: "잠실 풋살파크", isHome: false, result: { ourScore: 5, theirScore: 3 } },
  { id: "m3", date: "2026-03-29", time: "10:00", opponent: "스톰 FC", location: "강남 풋살장", isHome: true, result: { ourScore: 2, theirScore: 2 } },
  { id: "m4", date: "2026-03-22", time: "14:00", opponent: "블레이즈 FC", location: "마포 실내풋살장", isHome: false, result: { ourScore: 4, theirScore: 1 } },
];

export const videos: Video[] = [
  { id: "v1", matchId: "m2", title: "유나이티드 FC전 하이라이트", thumbnailUrl: "https://picsum.photos/seed/v1/400/225", videoUrl: "", duration: "3:24", type: "highlight", date: "2026-04-05", opponent: "유나이티드 FC" },
  { id: "v2", matchId: "m2", title: "유나이티드 FC전 풀경기", thumbnailUrl: "https://picsum.photos/seed/v2/400/225", videoUrl: "", duration: "48:12", type: "full", date: "2026-04-05", opponent: "유나이티드 FC" },
  { id: "v3", matchId: "m3", title: "스톰 FC전 하이라이트", thumbnailUrl: "https://picsum.photos/seed/v3/400/225", videoUrl: "", duration: "2:58", type: "highlight", date: "2026-03-29", opponent: "스톰 FC" },
  { id: "v4", matchId: "m4", title: "블레이즈 FC전 하이라이트", thumbnailUrl: "https://picsum.photos/seed/v4/400/225", videoUrl: "", duration: "4:01", type: "highlight", date: "2026-03-22", opponent: "블레이즈 FC" },
];

const sampleComments: Comment[] = [
  { id: "c1", author: players[1], content: "골 장면 미쳤다 ㅋㅋ", date: "2026-04-05" },
  { id: "c2", author: players[3], content: "수비 전환 좋았어!", date: "2026-04-06" },
];

export const posts: Post[] = [
  {
    id: "p1", type: "video", title: "유나이티드 FC전 하이라이트",
    content: "이번 경기 하이라이트입니다. 민수 해트트릭!",
    author: players[5], date: "2026-04-06", video: videos[0],
    likes: 6, comments: sampleComments, isLiked: true,
  },
  {
    id: "p2", type: "feedback", title: "수비 전환 피드백",
    content: "3번째 실점 장면에서 전환 수비가 늦었습니다. 다음 경기에서는 볼 로스트 시 즉시 프레싱 가주세요.",
    author: players[0], date: "2026-04-06",
    likes: 4, comments: [], isLiked: false,
  },
  {
    id: "p3", type: "video", title: "스톰 FC전 하이라이트",
    content: "무승부였지만 좋은 경기였습니다.",
    author: players[5], date: "2026-03-30", video: videos[2],
    likes: 3, comments: [], isLiked: false,
  },
  {
    id: "p4", type: "record", title: "블레이즈 FC전 경기 기록",
    content: "4-1 완승! 동현이 어시 3개 폼 미쳤음",
    author: players[0], date: "2026-03-22",
    likes: 5, comments: [], isLiked: true,
  },
];

export const announcements: Announcement[] = [
  { id: "a1", title: "4월 정기전 일정 안내", content: "4월 12일(토) 오후 2시, 강남 풋살장에서 FC 썬더와 경기가 있습니다. 참석 여부를 꼭 알려주세요!", date: "2026-04-06", author: "김민수", category: "schedule", isPinned: true, isRead: false },
  { id: "a2", title: "신규 유니폼 주문 마감 D-3", content: "새 시즌 유니폼 주문이 4월 10일에 마감됩니다. 아직 신청하지 않은 분은 서둘러주세요.", date: "2026-04-05", author: "이준호", category: "uniform", isPinned: true, isRead: false },
  { id: "a3", title: "영상 업로드 완료", content: "유나이티드 FC전 하이라이트와 풀경기 영상이 업로드되었습니다.", date: "2026-04-06", author: "한지훈", category: "general", isPinned: false, isRead: true },
  { id: "a4", title: "4월 회비 납부 안내", content: "4월 회비 3만원 납부 부탁드립니다. 계좌: 카카오뱅크 3333-01-1234567 (김민수)", date: "2026-04-01", author: "김민수", category: "fee", isPinned: false, isRead: true },
  { id: "a5", title: "강남 풋살장 주차 안내", content: "건물 지하 주차장 2시간 무료, 이후 30분당 1000원입니다. 가급적 대중교통 이용 부탁드립니다.", date: "2026-03-28", author: "김민수", category: "location", isPinned: false, isRead: true },
];

export const schedules: Schedule[] = [
  {
    id: "s1", type: "match", date: "2026-04-12", time: "14:00", location: "강남 풋살장", opponent: "FC 썬더",
    attendance: [
      { playerId: "1", status: "attending" }, { playerId: "2", status: "attending" },
      { playerId: "3", status: "attending" }, { playerId: "4", status: "maybe" },
      { playerId: "5", status: "attending" }, { playerId: "6", status: "not_attending" },
      { playerId: "7", status: "pending" }, { playerId: "8", status: "attending" },
    ],
  },
  {
    id: "s2", type: "training", date: "2026-04-09", time: "20:00", location: "강남 풋살장",
    description: "수요 정기훈련",
    attendance: [
      { playerId: "1", status: "attending" }, { playerId: "2", status: "pending" },
      { playerId: "3", status: "attending" }, { playerId: "4", status: "attending" },
      { playerId: "5", status: "not_attending" }, { playerId: "6", status: "attending" },
      { playerId: "7", status: "attending" }, { playerId: "8", status: "maybe" },
    ],
  },
  {
    id: "s3", type: "match", date: "2026-04-19", time: "10:00", location: "잠실 풋살파크", opponent: "레전드 FC", attendance: [],
  },
  {
    id: "s4", type: "training", date: "2026-04-16", time: "20:00", location: "강남 풋살장", description: "수요 정기훈련", attendance: [],
  },
  {
    id: "s5", type: "gathering", date: "2026-04-26", time: "18:00", location: "강남역 고기집", description: "4월 회식", attendance: [],
  },
];

export const records: Record[] = [
  {
    id: "r1", type: "match", date: "2026-04-05", title: "vs 유나이티드 FC",
    opponent: "유나이티드 FC", result: { ourScore: 5, theirScore: 3 },
    location: "잠실 풋살파크", memo: "민수 해트트릭, 동현 어시 2개",
    videos: [videos[0], videos[1]], attendees: ["1", "2", "3", "4", "5", "7", "8"],
  },
  {
    id: "r2", type: "match", date: "2026-03-29", title: "vs 스톰 FC",
    opponent: "스톰 FC", result: { ourScore: 2, theirScore: 2 },
    location: "강남 풋살장", memo: "후반에 집중력 떨어짐",
    videos: [videos[2]], attendees: ["1", "2", "3", "5", "6", "7", "8"],
  },
  {
    id: "r3", type: "match", date: "2026-03-22", title: "vs 블레이즈 FC",
    opponent: "블레이즈 FC", result: { ourScore: 4, theirScore: 1 },
    location: "마포 실내풋살장",
    videos: [videos[3]], attendees: ["1", "2", "3", "4", "6", "7", "8"],
  },
  {
    id: "r4", type: "training", date: "2026-04-02", title: "수요 정기훈련",
    location: "강남 풋살장", memo: "세트피스 연습, 코너킥 루틴 확인",
    videos: [], attendees: ["1", "3", "4", "5", "6", "7"],
  },
];

export const teamStats: TeamStats = {
  season: "2026 시즌",
  wins: 8, draws: 3, losses: 2,
  goalsScored: 45, goalsConceded: 22,
};
