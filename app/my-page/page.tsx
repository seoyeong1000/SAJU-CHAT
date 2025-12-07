import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowRight, Calendar, Plus, Sparkles, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { SajuResultPayload } from "@/types/saju";

type SavedSajuRow = {
  id: string;
  clerk_id: string;
  name: string;
  birth_date: string | null;
  relationship: string | null;
  day_pillar: string | null;
  payload: SajuResultPayload | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "생일 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
};

const buildDayPillarLabel = (row?: SavedSajuRow) => {
  if (!row) return null;
  if (row.day_pillar) return row.day_pillar;
  const stem = row.payload?.pillars?.day?.stem;
  const branch = row.payload?.pillars?.day?.branch;
  if (stem && branch) return `${stem}${branch}일주`;
  return null;
};

const encodePayload = (payload: SajuResultPayload | null) => {
  if (!payload) return null;
  try {
    return encodeURIComponent(JSON.stringify(payload));
  } catch {
    return null;
  }
};

const SavedCard = ({ item }: { item: SavedSajuRow }) => {
  const encoded = encodePayload(item.payload);
  const href = encoded ? `/saju-result?data=${encoded}&source=saved` : undefined;
  const dayPillar = buildDayPillarLabel(item);

  const CardBody = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-slate-900">{item.name}</p>
          {dayPillar && (
            <Badge className="rounded-full bg-violet-100 text-violet-700">{dayPillar}</Badge>
          )}
          {item.relationship && (
            <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
              {item.relationship}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>{formatDate(item.birth_date)}</span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </div>
  );

  if (!href) {
    return (
      <Card className="border border-dashed border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">{item.name}</p>
              <p className="text-sm text-slate-500">저장된 페이로드가 없어 이동할 수 없습니다.</p>
            </div>
            <Badge variant="outline" className="border-amber-200 text-amber-700">
              확인 필요
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-violet-400">
      <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="p-4">{CardBody}</CardContent>
      </Card>
    </Link>
  );
};

export default async function MyPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/my-page");
  }

  const [user, supabase] = await Promise.all([
    currentUser(),
    Promise.resolve(createClerkSupabaseClient()),
  ]);

  const query =
    (await supabase
      .from("saved_sajus")
      .select("id, clerk_id, name, birth_date, relationship, day_pillar, payload")
      .eq("clerk_id", userId)
      .order("created_at", { ascending: false })) ?? {};

  const savedList: SavedSajuRow[] = Array.isArray(query.data) ? query.data : [];
  const error = query.error ?? null;

  const displayName = user?.fullName ?? user?.username ?? "나의 프로필";
  const email =
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "이메일 정보 없음";

  const highlightPillar = buildDayPillarLabel(savedList[0]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <Card className="border-violet-100 shadow-md">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-xl text-slate-900">내 프로필</CardTitle>
              <p className="text-sm text-slate-600">계정 정보와 일주를 한눈에 확인하세요.</p>
            </div>
            <Badge variant="secondary" className="bg-violet-100 text-violet-700">
              대시보드
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.imageUrl ?? undefined} />
                <AvatarFallback className="bg-violet-100 text-violet-700">
                  {displayName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-slate-900">{displayName}</p>
                <p className="text-sm text-slate-600">{email}</p>
                {error && (
                  <p className="mt-1 text-xs text-amber-700">목록을 불러오지 못했습니다. 새로고침해 주세요.</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {highlightPillar ? (
                <Badge className="rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-3 py-2 text-white shadow-sm">
                  {highlightPillar}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-slate-200 text-slate-600">
                  일주 정보 없음
                </Badge>
              )}
              <Button variant="outline" className="rounded-full">
                내 정보 수정
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm">
          <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">빠른 추가</p>
            </div>
            <p className="text-sm text-amber-700">
              소중한 사람들의 사주를 저장해두고, 상담이나 리포트에 바로 활용하세요.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full rounded-full bg-amber-500 hover:bg-amber-600">
                <Link href="/bazi-test">
                  <Plus className="mr-2 h-4 w-4" />
                  새로운 만세력 추가
                </Link>
              </Button>
              <Button variant="secondary" asChild className="w-full rounded-full">
                <Link href="/saju-result">최근 결과 보기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">저장된 만세력</p>
            <p className="text-sm text-slate-600">이전 저장본을 클릭해 바로 결과 페이지로 이동하세요.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/bazi-test">
              <Plus className="mr-2 h-4 w-4" />
              새로운 만세력 추가
            </Link>
          </Button>
        </div>

        {savedList.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50">
            <CardContent className="flex flex-col items-start gap-3 p-6">
              <Badge variant="secondary" className="bg-white text-slate-600">
                빈 상태
              </Badge>
              <p className="text-base font-semibold text-slate-900">소중한 사람의 사주를 저장해 보세요!</p>
              <p className="text-sm text-slate-600">
                만세력을 계산한 뒤 &ldquo;저장하기&rdquo;를 누르면 여기에서 한 번에 확인할 수 있습니다.
              </p>
              <Button asChild className="rounded-full">
                <Link href="/bazi-test">
                  <Plus className="mr-2 h-4 w-4" />
                  지금 추가하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {savedList.map((item) => (
              <SavedCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">상담 기록</p>
            <p className="text-sm text-slate-600">AI 상담 내역이 여기에 채워질 예정입니다.</p>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            준비 중
          </Badge>
        </div>
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-3 p-6 text-slate-600">
            <UserRound className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800">AI 상담 기록을 준비하고 있어요.</p>
              <p className="text-sm text-slate-600">곧 최근 상담 대화가 이 영역에 표시됩니다.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
