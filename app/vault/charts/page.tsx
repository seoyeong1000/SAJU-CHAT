import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Calendar,
  Plus,
  Sparkles,
  Eye,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

type SajuChart = {
  id: string;
  owner_id: string;
  name: string;
  gender: string;
  birth_date: string | null;
  birth_hour: string | null;
  input_json: Record<string, unknown> | null;
  result_json: Record<string, unknown> | null;
  is_locked: boolean;
  created_at: string;
};

const formatDate = (value: string | null) => {
  if (!value) return "생일 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
};

const getDayPillar = (resultJson: Record<string, unknown> | null): string | null => {
  if (!resultJson) return null;
  const pillars = resultJson.pillars as Record<string, { stem?: string; branch?: string }> | undefined;
  if (!pillars?.day) return null;
  const { stem, branch } = pillars.day;
  if (stem && branch) return `${stem}${branch}`;
  return null;
};

const getGenderLabel = (gender: string) => {
  return gender === "male" ? "남" : gender === "female" ? "여" : "";
};

const ChartCard = ({ chart }: { chart: SajuChart }) => {
  const dayPillar = getDayPillar(chart.result_json);
  const encoded = chart.result_json
    ? encodeURIComponent(JSON.stringify(chart.result_json))
    : null;
  const href = encoded ? `/mansaeryeok/result?data=${encoded}&source=saved` : undefined;

  const CardBody = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-semibold text-slate-900">{chart.name}</p>
          {dayPillar && (
            <Badge className="rounded-full bg-violet-100 text-violet-700 text-xs">
              {dayPillar}일주
            </Badge>
          )}
          {chart.gender && (
            <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600 text-xs">
              {getGenderLabel(chart.gender)}
            </Badge>
          )}
          {chart.is_locked && (
            <Badge variant="outline" className="rounded-full border-amber-200 text-amber-600 text-xs">
              잠금
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(chart.birth_date)}</span>
          {chart.birth_hour && (
            <span className="text-slate-400">• {chart.birth_hour}</span>
          )}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
    </div>
  );

  if (!href) {
    return (
      <Card className="border border-dashed border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">{chart.name}</p>
              <p className="text-sm text-slate-500">결과 데이터가 없습니다.</p>
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
    <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-violet-400 rounded-xl">
      <Card className="transition hover:-translate-y-0.5 hover:shadow-lg border-slate-200">
        <CardContent className="p-4">{CardBody}</CardContent>
      </Card>
    </Link>
  );
};

export default async function VaultChartsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/vault/charts");
  }

  const [user, supabase] = await Promise.all([
    currentUser(),
    Promise.resolve(createClerkSupabaseClient()),
  ]);

  const { data: charts, error } = await supabase
    .from("saju_charts")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  const chartList: SajuChart[] = Array.isArray(charts) ? charts : [];

  const displayName = user?.fullName ?? user?.username ?? "사용자";
  const totalCharts = chartList.length;
  const lockedCharts = chartList.filter((c) => c.is_locked).length;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* 헤더 */}
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">저장된 만세력</h1>
          <p className="text-sm text-slate-500 mt-1">
            {displayName}님의 사주 {totalCharts}개
            {lockedCharts > 0 && ` (유료 ${lockedCharts}개)`}
          </p>
        </div>
        <Button asChild className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          <Link href="/mansaeryeok/new">
            <Plus className="mr-2 h-4 w-4" />
            새 만세력
          </Link>
        </Button>
      </section>

      {/* 에러 표시 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">
              목록을 불러오는 중 오류가 발생했습니다. 새로고침해 주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 목록 */}
      {chartList.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-slate-50">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                아직 저장된 만세력이 없습니다
              </p>
              <p className="text-sm text-slate-500 mt-1">
                만세력을 계산하고 저장하면 여기에서 확인할 수 있어요.
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/mansaeryeok/new">
                <Plus className="mr-2 h-4 w-4" />
                첫 만세력 만들기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {chartList.map((chart) => (
            <ChartCard key={chart.id} chart={chart} />
          ))}
        </div>
      )}

      {/* 안내 */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Eye className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">
                잠금된 만세력이란?
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                유료 리포트에 사용된 만세력은 데이터 보호를 위해 삭제가 제한됩니다.
                숨김 처리만 가능합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
