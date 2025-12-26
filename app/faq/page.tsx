import { HelpCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
};

const categoryLabels: Record<string, string> = {
  general: "일반",
  service: "서비스",
  payment: "결제",
  account: "계정",
};

export default async function FaqPage() {
  const supabase = getServiceRoleClient();

  const { data: faqItems } = await supabase
    .from("faq_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const items: FaqItem[] = faqItems ?? [];

  // 카테고리별 그룹화
  const groupedItems = items.reduce(
    (acc, item) => {
      const category = item.category || "general";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, FaqItem[]>
  );

  const categories = Object.keys(groupedItems);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* 헤더 */}
      <section className="text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">자주 묻는 질문</h1>
        <p className="text-sm text-slate-500 mt-2">
          궁금한 점이 있으시면 아래에서 찾아보세요.
        </p>
      </section>

      {/* FAQ 목록 */}
      {items.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-slate-50">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-slate-600">
              아직 등록된 FAQ가 없습니다.
            </p>
            <p className="text-sm text-slate-400">
              곧 자주 묻는 질문을 정리해 드리겠습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <section key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="rounded-full">
                  {categoryLabels[category] ?? category}
                </Badge>
                <span className="text-xs text-slate-400">
                  {groupedItems[category].length}개
                </span>
              </div>
              <Card>
                <Accordion type="single" collapsible className="w-full">
                  {groupedItems[category].map((item, index) => (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className={
                        index === groupedItems[category].length - 1
                          ? "border-b-0"
                          : ""
                      }
                    >
                      <AccordionTrigger className="px-4 hover:no-underline hover:bg-slate-50">
                        <span className="text-left text-sm font-medium text-slate-900">
                          {item.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">
                          {item.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            </section>
          ))}
        </div>
      )}

      {/* 추가 문의 안내 */}
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">
                원하는 답변을 찾지 못하셨나요?
              </p>
              <p className="text-sm text-slate-500 mt-1">
                1:1 문의를 통해 직접 질문해 주세요.
                빠른 시일 내에 답변 드리겠습니다.
              </p>
              <Button asChild className="mt-4 rounded-full" variant="outline">
                <Link href="/support">1:1 문의하기</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
