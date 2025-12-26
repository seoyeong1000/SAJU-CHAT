"use client";

import { useState } from "react";
import {
  MessageSquarePlus,
  ChevronRight,
  Clock,
  CheckCircle2,
  Send,
  ArrowLeft,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";

type SupportPost = {
  id: string;
  owner_id: string;
  category: string;
  title: string;
  body: string;
  status: "pending" | "replied";
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
};

const categories = [
  { value: "general", label: "일반 문의" },
  { value: "payment", label: "결제/환불" },
  { value: "bug", label: "오류 신고" },
  { value: "feature", label: "기능 제안" },
  { value: "account", label: "계정 문의" },
];

const getCategoryLabel = (value: string) => {
  return categories.find((c) => c.value === value)?.label ?? value;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

type Props = {
  userId: string;
  initialPosts: SupportPost[];
  error?: string;
};

export default function SupportClient({ userId, initialPosts, error }: Props) {
  const supabase = useClerkSupabaseClient();
  const [posts, setPosts] = useState<SupportPost[]>(initialPosts);
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [selectedPost, setSelectedPost] = useState<SupportPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 새 문의 폼 상태
  const [formCategory, setFormCategory] = useState("general");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formBody.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error: insertError } = await supabase
        .from("support_posts")
        .insert({
          owner_id: userId,
          category: formCategory,
          title: formTitle.trim(),
          body: formBody.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setPosts([data, ...posts]);
        setFormCategory("general");
        setFormTitle("");
        setFormBody("");
        setView("list");
      }
    } catch (err) {
      console.error("문의 등록 실패:", err);
      alert("문의 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = (post: SupportPost) => {
    setSelectedPost(post);
    setView("detail");
  };

  // 문의 목록 뷰
  if (view === "list") {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">1:1 문의</h1>
            <p className="text-sm text-slate-500 mt-1">
              궁금한 점이 있으시면 문의해 주세요.
            </p>
          </div>
          <Button
            onClick={() => setView("new")}
            className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            문의하기
          </Button>
        </section>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {posts.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <MessageSquarePlus className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  문의 내역이 없습니다
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  궁금한 점이 있으시면 문의해 주세요.
                </p>
              </div>
              <Button onClick={() => setView("new")} className="rounded-full">
                첫 문의하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openDetail(post)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className="text-xs rounded-full"
                        >
                          {getCategoryLabel(post.category)}
                        </Badge>
                        {post.status === "replied" ? (
                          <Badge className="bg-green-100 text-green-700 text-xs rounded-full">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            답변 완료
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs rounded-full"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            대기중
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-slate-900 truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    );
  }

  // 새 문의 작성 뷰
  if (view === "new") {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <section className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("list")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">새 문의</h1>
            <p className="text-sm text-slate-500 mt-1">
              문의 내용을 작성해 주세요.
            </p>
          </div>
        </section>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">문의 유형</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="문의 제목을 입력해 주세요"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">내용</Label>
              <Textarea
                id="body"
                placeholder="문의 내용을 상세히 작성해 주세요"
                rows={6}
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!formTitle.trim() || !formBody.trim() || isSubmitting}
              className="w-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {isSubmitting ? (
                "등록 중..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  문의 등록
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // 문의 상세 뷰
  if (view === "detail" && selectedPost) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <section className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("list")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs rounded-full">
                {getCategoryLabel(selectedPost.category)}
              </Badge>
              {selectedPost.status === "replied" ? (
                <Badge className="bg-green-100 text-green-700 text-xs rounded-full">
                  답변 완료
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs rounded-full">
                  대기중
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {selectedPost.title}
            </h1>
          </div>
        </section>

        {/* 내 문의 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-500">내 문의</CardTitle>
              <span className="text-xs text-slate-400">
                {formatDate(selectedPost.created_at)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">
              {selectedPost.body}
            </p>
          </CardContent>
        </Card>

        {/* 관리자 답변 */}
        {selectedPost.status === "replied" && selectedPost.admin_reply ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-green-700">
                  관리자 답변
                </CardTitle>
                {selectedPost.replied_at && (
                  <span className="text-xs text-green-600">
                    {formatDate(selectedPost.replied_at)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 whitespace-pre-wrap">
                {selectedPost.admin_reply}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-slate-200 bg-slate-50">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">답변을 기다리고 있습니다.</p>
              <p className="text-xs text-slate-400 mt-1">
                빠른 시일 내에 답변 드리겠습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    );
  }

  return null;
}
