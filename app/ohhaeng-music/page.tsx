import { Metadata } from "next";
import { Music } from "lucide-react";
import ComingSoon from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "오행음악 - 준비 중 | 사주로",
  description: "부족한 오행을 보충하는 힐링 음악 서비스가 곧 오픈됩니다.",
};

export default function OhhaengMusicPage() {
  return (
    <ComingSoon
      title="오행음악 서비스 준비 중"
      description="당신의 사주에서 부족한 오행을 보충하는 맞춤형 힐링 음악 서비스를 준비하고 있습니다."
      icon={Music}
      iconColor="text-pink-600"
      iconBg="bg-pink-100"
      expectedDate="2025년 상반기"
    />
  );
}
