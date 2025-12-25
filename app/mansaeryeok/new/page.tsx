import { Metadata } from 'next'
import { ManseForm } from '@/components/mansaeryeok/manse-form'

export const metadata: Metadata = {
  title: '나의 사주 알아보기',
  description: '태어난 순간의 하늘 기운을 읽어드립니다',
}

export default function MansaeryeokNewPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero Section */}
      <header className="pt-12 pb-8 px-4">
        <div className="max-w-lg mx-auto text-center space-y-3">
          <p className="text-stone-500 font-sans text-sm tracking-wide">
            타고난 기질 분석
          </p>
          <h1 className="font-serif text-3xl text-stone-800">
            나의 사주 알아보기
          </h1>
          <p className="text-stone-600 font-sans text-sm leading-relaxed max-w-sm mx-auto">
            태어난 순간의 하늘 기운을 읽어
            <br />
            당신만의 고유한 기질을 발견하세요
          </p>
        </div>
      </header>

      {/* Form Card */}
      <main className="px-4 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8">
            <ManseForm />
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-stone-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs">개인정보 보호</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs">정확한 계산</span>
              </div>
            </div>
            <p className="text-xs text-stone-400">
              Swiss Ephemeris 기반 진태양시 계산
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
