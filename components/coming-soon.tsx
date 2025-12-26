import Link from "next/link";
import { LucideIcon, Clock, ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  expectedDate?: string;
}

export default function ComingSoon({
  title,
  description,
  icon: Icon,
  iconColor = "text-purple-600",
  iconBg = "bg-purple-100",
  expectedDate,
}: ComingSoonProps) {
  return (
    <main className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <div className="text-center max-w-md">
        {/* 아이콘 */}
        <div className="relative inline-block mb-6">
          <div className={`w-24 h-24 rounded-full ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-12 h-12 ${iconColor}`} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        {/* 텍스트 */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{title}</h1>
        <p className="text-slate-500 mb-4 leading-relaxed">{description}</p>

        {expectedDate && (
          <Card className="mb-6 border-amber-200 bg-amber-50 inline-block">
            <CardContent className="px-4 py-2">
              <p className="text-sm text-amber-700">
                예상 오픈: <span className="font-medium">{expectedDate}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* 알림 신청 안내 */}
        <div className="bg-slate-100 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">오픈 알림 받기</span>
          </div>
          <p className="text-xs text-slate-500">
            서비스 오픈 시 알림을 받으시려면
            <br />
            1:1 문의에서 알림 신청을 해주세요.
          </p>
        </div>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
          <Link href="/mansaeryeok/new">
            <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
              만세력 먼저 보기
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
