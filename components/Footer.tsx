import Link from "next/link";
import { Sparkles, Mail } from "lucide-react";

const footerLinks = {
  서비스: [
    { href: "/mansaeryeok/new", label: "만세력 보기" },
    { href: "/chat", label: "사주상담" },
    { href: "/vault/charts", label: "저장된 만세력" },
  ],
  안내: [
    { href: "/faq", label: "자주 묻는 질문" },
    { href: "/support", label: "1:1 문의" },
    { href: "/terms", label: "이용약관" },
    { href: "/privacy", label: "개인정보처리방침" },
  ],
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 브랜드 영역 */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">사주로</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-md">
              적천수, 궁통보감, 자평진전 등 고전 명리 원전을 바탕으로
              정확한 사주 분석을 제공합니다. 당신의 운명을 더 깊이 이해해보세요.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:contact@sajuro.co.kr"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                contact@sajuro.co.kr
              </a>
            </div>
          </div>

          {/* 서비스 링크 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">서비스</h3>
            <ul className="space-y-2">
              {footerLinks.서비스.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-purple-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 안내 링크 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">안내</h3>
            <ul className="space-y-2">
              {footerLinks.안내.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-purple-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 하단 구분선 & 카피라이트 */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">
              &copy; {currentYear} 사주로. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">
                본 서비스는 오락 및 참고 목적으로 제공되며, 전문 상담을 대체하지 않습니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
