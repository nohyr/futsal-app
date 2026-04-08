# CLAUDE.md

## 한 줄 설명

풋살 팀 전용 커뮤니티 앱 — 카카오 로그인, 영상 피드, 일정/출석, 공지, 기록 관리 (React Native + Expo + Supabase)

## 기술 스택

| 구분 | 기술 |
|---|---|
| 언어 | TypeScript (~5.9) |
| 프레임워크 | React Native 0.81 + Expo SDK 54 |
| 라우팅 | Expo Router 6 (파일 기반) |
| 스타일링 | NativeWind 4 + Tailwind CSS 3.3 |
| 백엔드 | Supabase (PostgreSQL + Auth + Storage + RLS) |
| 인증 | 카카오 OAuth (Supabase Auth provider) |
| 패키지 매니저 | npm |
| 아이콘 | @expo/vector-icons (Ionicons) |

## 주요 디렉토리 구조

```
futsal-app/
├── app/                    # Expo Router 라우트 (파일 기반)
│   ├── _layout.tsx         # 루트 레이아웃 + AuthGate (인증 분기)
│   ├── (tabs)/             # 하단 5탭: 홈/일정/기록/공지/팀
│   ├── auth/               # 로그인, 회원가입, OAuth 콜백
│   ├── onboarding/         # 팀 생성/가입
│   ├── post/[id].tsx       # 게시글 상세 (동적 라우트)
│   ├── create-post/        # 게시글 작성
│   ├── create-schedule/    # 일정 등록
│   ├── create-notice/      # 공지 작성
│   ├── create-record/      # 기록 작성
│   └── mypage/             # 마이페이지
├── components/
│   ├── ui/                 # 공통 컴포넌트: Card, Button, Badge, Avatar, SectionHeader
│   ├── home/               # 홈 전용 컴포넌트
│   ├── schedule/           # 일정 전용 (MatchCalendar, AttendanceCard)
│   └── stats/              # 통계 전용 (TeamSummary, PlayerStatCard)
├── context/
│   └── AuthContext.tsx      # 인증 상태 관리 (useAuth 훅)
├── hooks/
│   └── useSupabase.ts       # 데이터 패칭 훅 (useTeam, usePosts, useSchedules 등)
├── lib/
│   ├── supabase.ts          # Supabase 클라이언트 초기화
│   └── api.ts               # API 서비스 레이어 (auth, teams, posts, schedules, notices, records, storage)
├── types/
│   ├── index.ts             # 비즈니스 타입 (Player, Team, Post, Schedule 등)
│   └── supabase.ts          # DB 테이블 타입
├── constants/
│   ├── colors.ts            # 디자인 토큰 (Colors 객체)
│   └── mock-data.ts         # 목업 데이터 (현재 미사용, 참고용)
├── supabase/
│   ├── schema.sql           # DB 스키마 (10 테이블 + 인덱스 + 헬퍼 함수)
│   └── rls.sql              # Row Level Security 정책
└── DESIGN.md                # 디자인 시스템 명세
```

## 빌드 / 실행 명령어

```bash
# 개발 서버
npx expo start --web        # 웹 브라우저
npx expo start              # QR코드 → Expo Go 앱

# 타입 체크
npx tsc --noEmit

# 패키지 설치 (peer dep 충돌 시)
npm install --legacy-peer-deps
```

## 인증 플로우

1. 앱 시작 → `AuthGate`가 세션 확인
2. 비로그인 → `/auth/login` (카카오 로그인 버튼)
3. 카카오 OAuth → Supabase Auth → URL hash에 `access_token` 반환
4. `AuthGate`가 hash 감지 → 세션 파싱 대기 → `public.users`에 프로필 upsert
5. 팀 없음 → `/onboarding/team-setup` / 팀 있음 → `/(tabs)`

## 데이터 패칭 패턴

- **훅**: `hooks/useSupabase.ts`의 `useTeam`, `usePosts`, `useSchedules`, `useNotices`, `useRecords`
- 모든 훅은 `currentTeamId`에 의존하며 `loading`, `refresh()` 상태를 제공
- **API 레이어**: `lib/api.ts`에서 CRUD 로직을 캡슐화 (`auth`, `teams`, `posts`, `schedules`, `notices`, `records`, `storage`)
- 화면에서는 훅으로 조회, api 모듈로 생성/수정/삭제

## 코드 스타일 & 컨벤션

### 파일/컴포넌트
- 컴포넌트: PascalCase (`PostFeedItem.tsx`)
- 훅: camelCase with `use` prefix (`useSupabase.ts`)
- 라우트: kebab-case 디렉토리 (`create-post/index.tsx`)
- 동적 라우트: `[param].tsx` (Expo Router 파일 기반)

### 스타일링
- **인라인 StyleSheet** 사용 (RN style prop)
- `Colors` 객체로 컬러 참조 (`Colors.primary[500]`, `Colors.gray[900]`)
- NativeWind/Tailwind CSS는 설정되어 있으나, 현재 코드는 주로 인라인 스타일 사용
- 그림자: `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`

### 컴포넌트 패턴
- `Card`: `variant="default" | "warm"` — 기본 흰색 / 따뜻한 베이지
- `Button`: `variant="primary" | "secondary" | "ghost"`, `size="sm" | "md" | "lg"`
- `Badge`: `variant="primary" | "success" | "warning" | "danger" | "neutral"`
- `Avatar`: `imageUrl`이 있으면 이미지, 없으면 이름 첫글자
- `SectionHeader`: 섹션 제목 + 선택적 액션 링크

### 타입
- `any` 타입 허용 (Supabase 조인 쿼리 결과)
- `tsconfig.json`에서 `strict: true`이나, 일부 유연성 허용
- Supabase 응답은 `as any` 캐스팅 후 사용

### UI 텍스트
- 모든 UI 문자열은 **한국어** (로그인, 피드, 경기, 참석 등)
- i18n 미적용 — 하드코딩된 한국어 문자열

### 아이콘
- `@expo/vector-icons`의 `Ionicons` 전용
- 크기: 14~32px (용도별 차이)

## Supabase DB 구조

10개 테이블: `users`, `teams`, `team_members`, `posts`, `comments`, `likes`, `schedules`, `attendances`, `notices`, `records`

RLS 헬퍼 함수:
- `get_my_user_id()` — 현재 인증 사용자의 `public.users.id`
- `is_team_member(team_id)` — 팀 멤버 여부
- `is_team_admin(team_id)` — 팀 관리자 여부

모든 데이터는 `currentTeamId` 기준으로 스코프됨.

## 금지 사항

- `supabase/schema.sql`, `supabase/rls.sql` 직접 수정 금지 — 새 마이그레이션 파일로 변경
- `lib/supabase.ts`의 Supabase URL/Key를 임의 변경 금지
- `app.json`의 `scheme`, `newArchEnabled` 변경 금지
- `babel.config.js`, `metro.config.js`의 NativeWind 설정 변경 금지
- `constants/colors.ts`의 기존 컬러 토큰 임의 변경 금지 — DESIGN.md와 동기화 필수
- `context/AuthContext.tsx`의 카카오 OAuth 플로우 변경 시 주의 — URL hash 파싱 로직 보존
- `types/index.ts`에서 기존 타입 필드 삭제 금지 — 확장만 허용
- 테스트 파일 삭제 금지 (추후 생성 시)
- `.gitignore`에 포함된 파일을 커밋하지 않기 (`node_modules`, `.env`, `dev.db`)
