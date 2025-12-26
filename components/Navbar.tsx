"use client";

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Compass, MessageCircle, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/mansaeryeok/new", label: "만세력", icon: Compass },
  { href: "/chat", label: "사주상담", icon: MessageCircle },
  { href: "/account/profile", label: "마이페이지", icon: User },
];

const Navbar = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex justify-between items-center px-4 lg:px-8 h-16 max-w-7xl mx-auto">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
            사주로
          </span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-purple-100 text-purple-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 우측 영역: 로그인/유저버튼 */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-purple-100",
                },
              }}
            />
          </SignedIn>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="메뉴 열기"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-600" />
            ) : (
              <Menu className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-purple-100 text-purple-700"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
