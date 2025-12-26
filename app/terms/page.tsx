import { Metadata } from "next";
import { FileText, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "이용약관 - 사주로",
  description: "사주로 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 mb-4">
            <FileText className="w-7 h-7 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">이용약관</h1>
          <p className="text-slate-500">최종 수정일: 2025년 1월 1일</p>
        </div>

        {/* 중요 안내 */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                본 서비스에서 제공하는 사주 분석 결과는 전통 명리학에 기반한{" "}
                <strong>참고 정보</strong>이며, 법률, 의료, 재정 등 전문적인 조언을
                대체하지 않습니다. 중요한 결정은 반드시 해당 분야 전문가와 상담하시기
                바랍니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 약관 본문 */}
        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">제1조 (목적)</h2>
            <p className="text-slate-600 leading-relaxed">
              이 약관은 사주로(이하 &quot;회사&quot;)가 제공하는 사주 분석 서비스(이하
              &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및
              책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">제2조 (정의)</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                &quot;서비스&quot;란 회사가 제공하는 만세력 분석, 사주 상담, 리포트 등
                명리학 기반 분석 서비스를 의미합니다.
              </li>
              <li>
                &quot;이용자&quot;란 이 약관에 따라 회사가 제공하는 서비스를 이용하는
                회원 및 비회원을 말합니다.
              </li>
              <li>
                &quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한 자로서,
                회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는 자를
                말합니다.
              </li>
              <li>
                &quot;크레딧&quot;이란 유료 서비스 이용을 위해 구매하는 서비스 내
                가상화폐를 의미합니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제3조 (약관의 효력 및 변경)
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
                공지함으로써 효력이 발생합니다.
              </li>
              <li>
                회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며,
                개정 시 적용일자 및 개정사유를 명시하여 7일 전부터 공지합니다.
              </li>
              <li>
                이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고
                탈퇴할 수 있습니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제4조 (서비스의 제공)
            </h2>
            <p className="text-slate-600 mb-3">
              회사는 다음과 같은 서비스를 제공합니다:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>만세력 분석: 생년월일시를 기반으로 한 사주팔자 분석</li>
              <li>맞춤 사주상담: 개인 맞춤형 사주 해석 및 상담</li>
              <li>전문 리포트: 커리어, 재물운, 연애운 등 심층 분석 리포트</li>
              <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제5조 (서비스의 특성 및 면책)
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                본 서비스에서 제공하는 사주 분석 결과는 전통 명리학 이론에 기반한
                참고 정보입니다.
              </li>
              <li>
                분석 결과는 오락 및 자기 이해의 목적으로 제공되며, 법률, 의료, 재정,
                직업 선택 등에 관한 전문적 조언을 대체하지 않습니다.
              </li>
              <li>
                이용자가 서비스 결과를 토대로 내린 결정에 대해 회사는 어떠한 법적
                책임도 지지 않습니다.
              </li>
              <li>
                회사는 서비스 결과의 정확성, 완전성, 특정 목적에의 적합성을 보증하지
                않습니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제6조 (유료 서비스 및 결제)
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                유료 서비스는 크레딧을 구매하여 이용할 수 있으며, 크레딧 가격 및 사용
                조건은 서비스 내에 별도 안내됩니다.
              </li>
              <li>
                결제는 신용카드, 간편결제 등 회사가 정한 방법으로 이루어집니다.
              </li>
              <li>
                구매한 크레딧은 환불이 제한될 수 있으며, 환불 정책은 별도 안내를
                따릅니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제7조 (환불 정책)
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                미사용 크레딧에 한해 구매일로부터 7일 이내 환불 신청이 가능합니다.
              </li>
              <li>
                이미 사용한 크레딧이나 서비스가 제공된 경우 환불이 불가합니다.
              </li>
              <li>
                환불은 결제 수단에 따라 3~7영업일 내에 처리됩니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제8조 (회원의 의무)
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                이용자는 서비스 이용 시 정확한 정보를 제공해야 하며, 타인의 정보를
                도용해서는 안 됩니다.
              </li>
              <li>
                이용자는 서비스를 부정한 목적으로 이용하거나, 회사의 운영을 방해해서는
                안 됩니다.
              </li>
              <li>
                이용자는 관련 법령과 이 약관의 규정을 준수해야 합니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제9조 (서비스 중단)
            </h2>
            <p className="text-slate-600 leading-relaxed">
              회사는 시스템 점검, 교체, 고장, 통신 장애 등 불가피한 사유가 발생한
              경우 서비스 제공을 일시적으로 중단할 수 있습니다. 이 경우 회사는 사전에
              공지하며, 사전 공지가 불가능한 경우 사후에 공지합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제10조 (지적재산권)
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                서비스에 포함된 모든 콘텐츠(텍스트, 이미지, 분석 결과 등)에 대한
                저작권 및 지적재산권은 회사에 귀속됩니다.
              </li>
              <li>
                이용자는 회사의 사전 동의 없이 서비스의 콘텐츠를 복제, 배포, 상업적으로
                이용할 수 없습니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              제11조 (분쟁 해결)
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 원만한
                해결을 위해 성실히 협의합니다.
              </li>
              <li>
                협의가 이루어지지 않을 경우, 관할 법원은 회사 소재지 법원으로 합니다.
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">부칙</h2>
            <p className="text-slate-600">
              이 약관은 2025년 1월 1일부터 시행합니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
