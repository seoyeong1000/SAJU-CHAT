import { Metadata } from "next";
import { BookOpen } from "lucide-react";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "사주풀이 - 준비 중 | 사주로",
  description: "고전 명리학을 바탕으로 한 전문 사주풀이 서비스가 곧 오픈됩니다.",
};

export default function InterpretationPage() {
  return (
    <ComingSoon
      title="사주풀이 서비스 준비 중"
      description="적천수, 궁통보감 등 고전 명리 원전을 바탕으로 한 전문 사주풀이 서비스를 준비하고 있습니다."
      icon={BookOpen}
      iconColor="text-amber-600"
      iconBg="bg-amber-100"
      expectedDate="2025년 상반기"
    />
  );
}
