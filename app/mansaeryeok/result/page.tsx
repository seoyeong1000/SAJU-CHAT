import { Metadata } from 'next'
import ResultDashboard from '@/components/mansaeryeok/result-dashboard'

export const metadata: Metadata = {
  title: '사주 결과 - 나의 타고난 기질',
  description: '당신만의 고유한 기질과 운명의 흐름을 확인하세요',
}

export default function MansaeryeokResultPage() {
  return <ResultDashboard />
}
