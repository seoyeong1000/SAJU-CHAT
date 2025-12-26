"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "sajuro_cookie_consent";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 이미 동의했는지 확인
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // 약간의 딜레이 후 표시 (페이지 로드 후)
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* 아이콘 & 텍스트 */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 flex-shrink-0">
                <Cookie className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  쿠키 사용 안내
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  사주로는 더 나은 서비스 제공을 위해 쿠키를 사용합니다.
                  사이트 이용 시 쿠키 사용에 동의하게 됩니다.{" "}
                  <Link
                    href="/privacy"
                    className="text-purple-600 hover:underline"
                  >
                    개인정보처리방침
                  </Link>
                  에서 자세한 내용을 확인하세요.
                </p>
              </div>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecline}
              className="text-slate-500 hover:text-slate-700"
            >
              거부
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
              동의
            </Button>
          </div>

          {/* 닫기 버튼 (모바일) */}
          <button
            onClick={handleDecline}
            className="absolute top-3 right-3 md:hidden p-1 text-slate-400 hover:text-slate-600"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
