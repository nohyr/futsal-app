import { Redirect } from "expo-router";

// 카카오 로그인만 사용하므로 회원가입은 로그인으로 리다이렉트
export default function SignupScreen() {
  return <Redirect href="/auth/login" />;
}
