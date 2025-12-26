"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 Sentry 등으로 전송)
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="text-center max-w-md">
        {/* 아이콘 */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        {/* 텍스트 */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          문제가 발생했습니다
        </h1>
        <p className="text-slate-500 mb-6 leading-relaxed">
          페이지를 불러오는 중 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>

        {/* 에러 코드 (개발용) */}
        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono">
            오류 코드: {error.digest}
          </p>
        )}

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-slate-200"
            >
              <Home className="w-4 h-4 mr-2" />
              홈으로 가기
            </Button>
          </Link>
        </div>

        {/* 문의 안내 */}
        <p className="mt-8 text-sm text-slate-400">
          문제가 지속되면{" "}
          <Link href="/support" className="text-purple-600 hover:underline">
            1:1 문의
          </Link>
          로 알려주세요.
        </p>
      </div>
    </main>
  );
}
