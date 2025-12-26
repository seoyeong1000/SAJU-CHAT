import Link from "next/link";
import { Compass, BookOpen, MessageCircle, Music, ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// 메인 서비스 카드 데이터
const services = [
  {
    href: "/mansaeryeok/new",
    icon: Compass,
    title: "만세력",
    subtitle: "사주팔자 보기",
    description: "정확한 천문 계산으로 당신의 사주팔자를 확인하세요.",
    gradient: "from-purple-500 to-indigo-600",
    bgGradient: "from-purple-50 to-indigo-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    href: "/interpretation",
    icon: BookOpen,
    title: "사주풀이",
    subtitle: "운명 해석",
    description: "고전 명리학을 바탕으로 당신의 운명을 풀어드립니다.",
    gradient: "from-amber-500 to-orange-600",
    bgGradient: "from-amber-50 to-orange-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    href: "/chat",
    icon: MessageCircle,
    title: "사주상담",
    subtitle: "1:1 상담",
    description: "궁금한 점을 물어보세요. 전문 상담으로 답해드립니다.",
    gradient: "from-emerald-500 to-teal-600",
    bgGradient: "from-emerald-50 to-teal-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    href: "/ohhaeng-music",
    icon: Music,
    title: "오행음악",
    subtitle: "힐링 사운드",
    description: "부족한 오행을 보충하는 힐링 음악을 들어보세요.",
    gradient: "from-pink-500 to-rose-600",
    bgGradient: "from-pink-50 to-rose-50",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
];

// 특징 데이터
const features = [
  {
    title: "적천수 기반",
    description: "고전 명리 원전의 정수",
  },
  {
    title: "정밀 천문 계산",
    description: "Swiss Ephemeris 기반",
  },
  {
    title: "전문가 검증",
    description: "명리학 전문가 감수",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* 배경 장식 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* 뱃지 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/90">정통 명리학 기반 사주 분석</span>
            </div>

            {/* 메인 타이틀 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              당신의 운명을
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                더 깊이 이해하다
              </span>
            </h1>

            {/* 서브 타이틀 */}
            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
              적천수, 궁통보감, 자평진전 등 고전 명리 원전을 바탕으로
              <br className="hidden md:block" />
              정확하고 깊이 있는 사주 분석을 제공합니다.
            </p>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/mansaeryeok/new">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg shadow-purple-500/25">
                  <Compass className="w-5 h-5 mr-2" />
                  무료 만세력 보기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-white/30 text-white hover:bg-white/10 rounded-2xl">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  사주상담 시작
                </Button>
              </Link>
            </div>

            {/* 특징 배너 */}
            <div className="mt-16 flex flex-wrap justify-center gap-6 md:gap-10">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{feature.title}</p>
                    <p className="text-xs text-slate-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 서비스 카드 섹션 */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              사주로의 서비스
            </h2>
            <p className="text-lg text-slate-600">
              원하는 서비스를 선택해 시작하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link key={service.href} href={service.href} className="group">
                  <Card className={`h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br ${service.bgGradient} group-hover:-translate-y-1`}>
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-2xl ${service.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${service.iconColor}`} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
                          <span className="text-xs font-medium text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                            {service.subtitle}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center text-sm font-medium text-slate-700 group-hover:text-slate-900">
                        시작하기
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 소개 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            사주로가 특별한 이유
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            사주로는 단순한 운세 서비스가 아닙니다.
            <br />
            적천수, 궁통보감, 자평진전 등 <span className="font-semibold text-slate-900">고전 명리 원전</span>을 바탕으로
            <br />
            Swiss Ephemeris 기반의 <span className="font-semibold text-slate-900">정밀한 천문 계산</span>과
            <br />
            명리학 전문가의 <span className="font-semibold text-slate-900">검증된 해석</span>을 제공합니다.
          </p>
          <Link href="/mansaeryeok/new">
            <Button size="lg" className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg">
              지금 바로 시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
