"use client";

import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="text-center max-w-md">
        {/* 아이콘 */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
            <Compass className="w-12 h-12 text-purple-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
            404
          </div>
        </div>

        {/* 텍스트 */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          요청하신 페이지가 존재하지 않거나
          <br />
          주소가 변경되었을 수 있습니다.
        </p>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
              <Home className="w-4 h-4 mr-2" />
              홈으로 가기
            </Button>
          </Link>
          <Link href="/mansaeryeok/new">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Compass className="w-4 h-4 mr-2" />
              만세력 보기
            </Button>
          </Link>
        </div>

        {/* 뒤로가기 링크 */}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.history.back();
            }
          }}
          className="mt-6 inline-flex items-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          이전 페이지로 돌아가기
        </button>
      </div>
    </main>
  );
}
