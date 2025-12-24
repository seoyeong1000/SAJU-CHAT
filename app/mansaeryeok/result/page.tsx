import { Metadata } from 'next'
import { ManseResult } from '@/components/mansaeryeok/manse-result'

export const metadata: Metadata = {
  title: '사주 결과 - 만세력',
  description: '당신의 사주팔자 결과입니다',
}

export default function MansaeryeokResultPage() {
  return <ManseResult />
}
