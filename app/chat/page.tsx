"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { Send, Loader2, Sparkles, MessageCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 메시지 타입
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

// UUID 생성 함수
function generateUUID(): string {
  return crypto.randomUUID();
}

// 세션 ID 관리 (localStorage)
function getOrCreateSessionId(): string {
  const STORAGE_KEY = "saju-chat-session-id";

  if (typeof window === "undefined") {
    return generateUUID();
  }

  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤을 맨 아래로
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 세션 ID 초기화 및 기존 메시지 로드
  useEffect(() => {
    if (!isLoaded || !user) return;

    const sid = getOrCreateSessionId();
    setSessionId(sid);

    // 기존 메시지 로드
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/chat?sessionId=${sid}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("메시지 로드 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [isLoaded, user]);

  // 메시지 전송
  const handleSend = async () => {
    if (!inputText.trim() || isSending || !sessionId) return;

    const userMessage = inputText.trim();
    setInputText("");
    setError(null);
    setIsSending(true);

    // 낙관적 UI 업데이트 - 사용자 메시지 즉시 표시
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "응답 생성에 실패했습니다.");
      }

      const data = await response.json();

      // AI 응답 추가
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      // 실패 시 낙관적 업데이트 롤백
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  // 로딩 중
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* 배경 효과 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      {/* 비로그인 상태 */}
      <SignedOut>
        <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold">AI 사주 상담</h1>
            <p className="text-slate-400">
              로그인하시면 AI 상담사와 1:1 대화를 나눌 수 있습니다.
              <br />
              이전 상담 내용도 기억하여 맞춤형 조언을 드립니다.
            </p>
            <Link href="/sign-in">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
                <LogIn className="w-4 h-4 mr-2" />
                로그인하고 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </SignedOut>

      {/* 로그인 상태 */}
      <SignedIn>
        <div className="relative z-10 flex flex-col h-screen max-w-2xl mx-auto">
          {/* 헤더 */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 backdrop-blur-md bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">AI 사주 상담</h1>
                <p className="text-xs text-slate-400">당신만을 위한 맞춤 조언</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                홈으로
              </Button>
            </Link>
          </header>

          {/* 메시지 영역 */}
          <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-300 font-medium">안녕하세요!</p>
                  <p className="text-slate-500 text-sm mt-1">
                    무엇이든 물어보세요. 사주를 바탕으로 조언해 드릴게요.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {["오늘의 운세가 궁금해요", "연애운을 봐주세요", "직장 고민이 있어요"].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInputText(suggestion)}
                        className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 border border-slate-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-md"
                        : "bg-slate-800/80 text-slate-200 rounded-bl-md border border-slate-700/50"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}

            {/* 로딩 인디케이터 */}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 text-slate-400 px-4 py-3 rounded-2xl rounded-bl-md border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">답변을 작성하고 있어요...</span>
                  </div>
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-900/30 text-red-300 px-4 py-2 rounded-lg text-sm border border-red-800/50">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>

          {/* 입력 영역 */}
          <footer className="px-6 py-4 border-t border-slate-800/50 backdrop-blur-md bg-slate-950/80">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                disabled={isSending}
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 disabled:opacity-50 transition-all"
              />
              <Button
                onClick={handleSend}
                disabled={!inputText.trim() || isSending}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-600 text-center mt-3">
              AI 상담은 참고용이며, 중요한 결정은 전문가와 상담하세요.
            </p>
          </footer>
        </div>
      </SignedIn>
    </div>
  );
}
