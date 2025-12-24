// 빌드 시 서버 사이드 렌더링 방지 (Clerk useAuth 훅 호환성)
export const dynamic = "force-dynamic";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
