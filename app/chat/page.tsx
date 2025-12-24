

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  House,
  Users,
  Search,
  Send,
  LogOut,
  MoreVertical,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// 메시지 타입 정의
interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  room_id: string;
  created_at: string;
}

// 채팅방 목록
const ROOMS = [
  { id: "general", name: "일반 채팅방", description: "모든 사용자" },
  { id: "random", name: "자유 토론방", description: "자유로운 대화" },
  { id: "tech", name: "기술 이야기", description: "개발 관련" },
];

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 초기 메시지 로드 및 Realtime 구독
  useEffect(() => {
    if (!isLoaded || !user) return;

    const loadMessages = async () => {
      setIsLoading(true);

      // 기존 메시지 로드
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", selectedRoom.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("메시지 로드 에러:", error);
      } else {
        setMessages(data || []);
      }

      setIsLoading(false);
    };

    loadMessages();

    // =====================================================
    // Supabase Realtime 구독 설정
    // =====================================================
    // 이전 구독이 있으면 해제
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // 새 채널 구독
    const channel = supabase
      .channel(`room:${selectedRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        (payload) => {
          // 새 메시지가 들어오면 상태에 추가
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        (payload) => {
          // 메시지가 삭제되면 상태에서 제거
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
        }
      )
      .subscribe((status) => {
        console.log(`Realtime 구독 상태: ${status}`);
      });

    channelRef.current = channel;

    // 클린업
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isLoaded, user, selectedRoom.id, supabase]);

  // 메시지 전송
  const handleSend = async () => {
    if (!inputText.trim() || !user || isSending) return;

    setIsSending(true);
    const messageContent = inputText;
    setInputText(""); // 입력창 즉시 비우기

    const { error } = await supabase.from("messages").insert({
      content: messageContent,
      sender_id: user.id,
      sender_name: user.fullName || user.firstName || "익명",
      room_id: selectedRoom.id,
    });

    if (error) {
      console.error("메시지 전송 에러:", error);
      setInputText(messageContent); // 에러 시 복원
      alert("메시지 전송에 실패했습니다.");
    }

    setIsSending(false);
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 로딩 중이거나 로그인 안 됨
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-gray-600">로그인이 필요합니다.</p>
        <a href="/sign-in" className="text-sky-500 hover:underline">
          로그인하기
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-slate-800">
      {/* 1. Left Navigation Sidebar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 justify-between">
        <div className="flex flex-col gap-8">
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <House className="w-6 h-6 text-slate-900" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Users className="w-6 h-6 text-slate-900" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Search className="w-6 h-6 text-slate-900" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Send className="w-6 h-6 text-slate-900" />
          </button>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors mb-4">
          <LogOut className="w-6 h-6 text-indigo-600 rotate-180" />
        </button>
      </div>

      {/* 2. Room List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Current User Profile (Top) */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
            <Image
              src={user.imageUrl || "https://api.dicebear.com/9.x/avataaars/svg?seed=User"}
              alt="My Profile"
              width={40}
              height={40}
            />
          </div>
          <div>
            <div className="font-bold text-sm">
              {user.fullName || user.firstName || "사용자"}
            </div>
            <div className="text-xs text-gray-400">온라인</div>
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs text-gray-500 font-medium">
            채팅방 목록
          </div>
          {ROOMS.map((room) => (
            <div
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                selectedRoom.id === room.id ? "bg-sky-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{room.name}</div>
                <div className="text-xs text-gray-400">{room.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Realtime 상태 표시 */}
        <div className="p-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Realtime 연결됨
          </div>
        </div>
      </div>

      {/* 3. Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <div className="font-bold text-sm">{selectedRoom.name}</div>
              <div className="text-xs text-gray-400">
                {selectedRoom.description}
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              아직 메시지가 없습니다. 첫 메시지를 보내보세요!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}
                  >
                    {!isMe && (
                      <div className="text-xs text-gray-500 mb-1 ml-1">
                        {msg.sender_name}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg text-sm ${
                        isMe
                          ? "bg-sky-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`text-xs text-gray-400 mt-1 ${isMe ? "text-right mr-1" : "ml-1"}`}
                    >
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center border border-sky-500 rounded-lg overflow-hidden">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="메시지를 입력하세요..."
              disabled={isSending}
              className="flex-1 px-4 py-3 outline-none text-sm placeholder-gray-400 disabled:bg-gray-50"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !inputText.trim()}
              className="bg-sky-500 text-white px-6 py-3 text-sm font-medium hover:bg-sky-600 transition-colors disabled:bg-sky-300 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "전송"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
