import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  User,
  Mail,
  Calendar,
  Shield,
  ExternalLink,
  ChevronRight,
  MessageCircle,
  Coins,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

const formatDate = (value: string | number | Date | null | undefined) => {
  if (!value) return "-";
  const date =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/account/profile");
  }

  const [user, supabase] = await Promise.all([
    currentUser(),
    Promise.resolve(createClerkSupabaseClient()),
  ]);

  // 프로필 정보 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // 저장된 차트 수 조회
  const { count: chartCount } = await supabase
    .from("saju_charts")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId);

  const displayName = user?.fullName ?? user?.username ?? "사용자";
  const email =
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "-";
  const createdAt = user?.createdAt;
  const isAdmin = profile?.is_admin ?? false;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* 프로필 헤더 */}
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-purple-100">
              <AvatarImage src={user?.imageUrl ?? undefined} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xl">
                {displayName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
                {isAdmin && (
                  <Badge className="bg-amber-100 text-amber-700 rounded-full">
                    <Shield className="h-3 w-3 mr-1" />
                    관리자
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{email}</p>
              <p className="text-xs text-slate-400 mt-1">
                가입일: {formatDate(createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{chartCount ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">저장된 만세력</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-400">0</p>
            <p className="text-sm text-slate-500 mt-1">구매한 리포트</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-100">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Coins className="h-5 w-5 text-indigo-400" />
              <p className="text-3xl font-bold text-indigo-500">0</p>
            </div>
            <p className="text-sm text-slate-500 mt-1">상담 크레딧</p>
          </CardContent>
        </Card>
      </div>

      {/* 계정 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400">이름</p>
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Mail className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400">이메일</p>
              <p className="text-sm font-medium text-slate-900">{email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Calendar className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400">가입일</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 바로가기 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">바로가기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link
            href="/vault/charts"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm text-slate-700">저장된 만세력</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/chat"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700">맞춤 사주상담</span>
              <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200">
                크레딧 0회
              </Badge>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/support"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm text-slate-700">1:1 문의하기</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/faq"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm text-slate-700">자주 묻는 질문</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </CardContent>
      </Card>

      {/* 계정 관리 안내 */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white">
              <ExternalLink className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">
                프로필 수정이 필요하신가요?
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                이름, 이메일, 비밀번호 변경은 상단의 프로필 아이콘을 클릭하여
                Clerk 계정 설정에서 변경할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
