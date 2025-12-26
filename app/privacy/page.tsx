import { Metadata } from "next";
import { Shield, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 사주로",
  description: "사주로 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 mb-4">
            <Shield className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            개인정보처리방침
          </h1>
          <p className="text-slate-500">최종 수정일: 2025년 1월 1일</p>
        </div>

        {/* 요약 카드 */}
        <Card className="mb-8 border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-800">
              사주로(이하 &quot;회사&quot;)는 이용자의 개인정보를 소중히 여기며,
              「개인정보 보호법」을 준수합니다. 본 개인정보처리방침을 통해 수집하는
              개인정보의 항목, 이용 목적, 보유 기간 등을 안내드립니다.
            </p>
          </CardContent>
        </Card>

        {/* 본문 */}
        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              1. 수집하는 개인정보 항목
            </h2>
            <p className="text-slate-600 mb-3">
              회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">
              필수 수집 항목
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>회원가입: 이메일 주소, 이름(닉네임)</li>
              <li>소셜 로그인: 소셜 계정 고유 ID, 이메일, 프로필 정보</li>
              <li>사주 분석: 생년월일, 출생시간, 성별, 출생지역</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">
              자동 수집 항목
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>서비스 이용 기록, 접속 로그, 접속 IP</li>
              <li>쿠키, 기기 정보(브라우저 종류, OS)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2">
              결제 시 수집 항목
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>결제 수단 정보(신용카드사, 결제 승인 번호 등)</li>
              <li>결제 기록</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              2. 개인정보 수집 및 이용 목적
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>
                <strong>서비스 제공:</strong> 만세력 분석, 맞춤 사주상담, 리포트 제공
              </li>
              <li>
                <strong>회원 관리:</strong> 회원 가입, 본인 확인, 서비스 이용 기록 관리
              </li>
              <li>
                <strong>결제 처리:</strong> 유료 서비스 결제 및 환불 처리
              </li>
              <li>
                <strong>고객 지원:</strong> 문의 응대, 불만 처리, 공지사항 전달
              </li>
              <li>
                <strong>서비스 개선:</strong> 이용 통계 분석, 서비스 품질 향상
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              3. 개인정보 보유 및 이용 기간
            </h2>
            <p className="text-slate-600 mb-3">
              회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이
              파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 아래 기간 동안
              보관합니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>
                <strong>계약 또는 청약철회 기록:</strong> 5년 (전자상거래법)
              </li>
              <li>
                <strong>결제 및 재화 공급 기록:</strong> 5년 (전자상거래법)
              </li>
              <li>
                <strong>소비자 불만 또는 분쟁 처리 기록:</strong> 3년 (전자상거래법)
              </li>
              <li>
                <strong>접속 기록:</strong> 3개월 (통신비밀보호법)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="text-slate-600">
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만,
              다음의 경우는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mt-3">
              <li>이용자가 사전에 동의한 경우</li>
              <li>
                법령에 의거하거나, 수사 목적으로 법령에 정해진 절차에 따라 요청이 있는
                경우
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              5. 개인정보 처리 위탁
            </h2>
            <p className="text-slate-600 mb-3">
              회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 px-4 py-2 text-left">
                      수탁업체
                    </th>
                    <th className="border border-slate-200 px-4 py-2 text-left">
                      위탁 업무
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 px-4 py-2">
                      Clerk Inc.
                    </td>
                    <td className="border border-slate-200 px-4 py-2">
                      회원 인증 및 로그인 서비스
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-4 py-2">
                      Supabase Inc.
                    </td>
                    <td className="border border-slate-200 px-4 py-2">
                      데이터베이스 호스팅 및 저장
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-4 py-2">
                      Vercel Inc.
                    </td>
                    <td className="border border-slate-200 px-4 py-2">
                      웹 서비스 호스팅
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              6. 이용자의 권리와 행사 방법
            </h2>
            <p className="text-slate-600 mb-3">
              이용자는 언제든지 다음 권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정 및 삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
              <li>회원 탈퇴</li>
            </ul>
            <p className="text-slate-600 mt-3">
              권리 행사는 마이페이지 또는 고객센터(1:1 문의)를 통해 가능합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              7. 개인정보 파기 절차 및 방법
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>
                <strong>파기 절차:</strong> 보유 기간이 경과하거나 처리 목적이 달성된
                개인정보는 지체 없이 파기합니다.
              </li>
              <li>
                <strong>파기 방법:</strong> 전자적 파일은 복구할 수 없도록 영구 삭제하며,
                종이 문서는 분쇄 또는 소각합니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              8. 쿠키(Cookie) 사용
            </h2>
            <p className="text-slate-600 mb-3">
              회사는 서비스 이용 편의를 위해 쿠키를 사용합니다. 쿠키는 웹사이트 운영에
              이용되는 서버가 이용자의 브라우저에 보내는 작은 텍스트 파일입니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>
                <strong>쿠키 사용 목적:</strong> 로그인 유지, 이용자 설정 저장, 서비스
                이용 분석
              </li>
              <li>
                <strong>쿠키 거부:</strong> 브라우저 설정에서 쿠키 저장을 거부할 수
                있으며, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              9. 개인정보보호 책임자
            </h2>
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">
                      개인정보보호 책임자
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      이메일: privacy@sajuro.co.kr
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      개인정보 관련 문의사항은 위 연락처로 문의해 주시면 신속하게
                      처리하겠습니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              10. 개인정보처리방침 변경
            </h2>
            <p className="text-slate-600">
              이 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 수정될 수
              있습니다. 변경 시 웹사이트 공지사항을 통해 안내드리며, 변경된 방침은
              공지한 날로부터 7일 후 시행됩니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">부칙</h2>
            <p className="text-slate-600">
              이 개인정보처리방침은 2025년 1월 1일부터 시행합니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
