import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ManseForm } from '@/components/mansaeryeok/manse-form'

export const metadata: Metadata = {
  title: '만세력 - 사주팔자 계산',
  description: '생년월일시를 입력하여 사주팔자를 확인하세요',
}

export default function MansaeryeokNewPage() {
  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">만세력</CardTitle>
          <CardDescription>
            생년월일시를 입력하면 사주팔자를 계산합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManseForm />
        </CardContent>
      </Card>
    </div>
  )
}
