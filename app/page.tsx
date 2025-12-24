import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RiSupabaseFill } from "react-icons/ri";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center px-8 py-16 lg:py-24">
      <section className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start lg:items-center">
        {/* 좌측: 환영 메시지 */}
        <div className="flex flex-col gap-8">
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
            AI 사주 서비스
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed">
            정통 만세력과 AI 기반 사주풀이로 당신의 운명을 읽어드립니다.
          </p>
        </div>

        {/* 우측: 버튼 세로 정렬 */}
        <div className="flex flex-col gap-6">
          <Link href="/mansaeryeok" className="w-full">
            <Button className="w-full h-28 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transition-shadow">
              <Sparkles className="w-8 h-8" />
              <span>만세력 - 사주팔자 보기</span>
            </Button>
          </Link>
          <Link href="/storage-test" className="w-full">
            <Button
              className="w-full h-28 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transition-shadow"
              variant="outline"
            >
              <RiSupabaseFill className="w-8 h-8" />
              <span>Storage 파일 업로드 테스트</span>
            </Button>
          </Link>
          <Link href="/auth-test" className="w-full">
            <Button
              className="w-full h-28 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transition-shadow"
              variant="outline"
            >
              <RiSupabaseFill className="w-8 h-8" />
              <span>Clerk + Supabase 인증 연동</span>
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
