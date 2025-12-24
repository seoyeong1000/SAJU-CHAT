'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Daeun, FiveElement } from '@/lib/manse'

// 오행 색상
const ELEMENT_COLORS: Record<FiveElement, string> = {
  wood: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  fire: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  earth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  metal: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  water: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}

interface DaeunTimelineProps {
  daeunList: Daeun[]
  startAge: number
  currentAge?: number
  gender: 'male' | 'female'
  isForward: boolean
}

export function DaeunTimeline({
  daeunList,
  startAge,
  currentAge,
  gender,
  isForward,
}: DaeunTimelineProps) {
  // 현재 대운 찾기
  const currentDaeunIndex = useMemo(() => {
    if (currentAge === undefined) return -1
    return daeunList.findIndex(
      (d) => currentAge >= d.startAge && currentAge <= d.endAge
    )
  }, [daeunList, currentAge])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">대운(大運)</CardTitle>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>대운수: {startAge}세</span>
            <span>|</span>
            <span>{isForward ? '순행' : '역행'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 대운 타임라인 */}
        <div className="relative">
          {/* 연결선 */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-border" />

          {/* 대운 목록 */}
          <div className="relative flex overflow-x-auto pb-4 gap-1">
            {daeunList.map((daeun, index) => (
              <div
                key={daeun.order}
                className={cn(
                  'flex-shrink-0 w-20 flex flex-col items-center',
                  currentDaeunIndex === index && 'scale-105'
                )}
              >
                {/* 나이 표시 */}
                <div className="text-xs text-muted-foreground mb-1">
                  {daeun.startAge}~{daeun.endAge}세
                </div>

                {/* 연결점 */}
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 bg-background z-10',
                    currentDaeunIndex === index
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}
                />

                {/* 간지 */}
                <div
                  className={cn(
                    'mt-2 p-2 rounded-lg border text-center min-w-[64px]',
                    currentDaeunIndex === index
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="text-lg font-bold">
                    {daeun.stemBranch.hangul}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {daeun.stemBranch.hanja}
                  </div>
                </div>

                {/* 십성 */}
                <div className="mt-2 flex flex-col gap-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      ELEMENT_COLORS[daeun.stemBranch.stem.element]
                    )}
                  >
                    {daeun.stemSipsung.shortName}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      ELEMENT_COLORS[daeun.stemBranch.branch.element]
                    )}
                  >
                    {daeun.branchSipsung.shortName}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 현재 대운 정보 */}
        {currentDaeunIndex >= 0 && currentAge !== undefined && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">현재 대운:</span>
              <span className="font-bold text-lg">
                {daeunList[currentDaeunIndex].stemBranch.hangul} (
                {daeunList[currentDaeunIndex].stemBranch.hanja})
              </span>
            </div>
            <div className="mt-2 flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">천간 십성: </span>
                <span className="font-medium">
                  {daeunList[currentDaeunIndex].stemSipsung.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">지지 십성: </span>
                <span className="font-medium">
                  {daeunList[currentDaeunIndex].branchSipsung.name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 대운 표 (세로) */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">대운 상세</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-1 text-left text-muted-foreground">대운</th>
                  <th className="py-2 px-1 text-center text-muted-foreground">나이</th>
                  <th className="py-2 px-1 text-center text-muted-foreground">간지</th>
                  <th className="py-2 px-1 text-center text-muted-foreground">천간</th>
                  <th className="py-2 px-1 text-center text-muted-foreground">지지</th>
                </tr>
              </thead>
              <tbody>
                {daeunList.map((daeun, index) => (
                  <tr
                    key={daeun.order}
                    className={cn(
                      'border-b last:border-0',
                      currentDaeunIndex === index && 'bg-primary/5'
                    )}
                  >
                    <td className="py-2 px-1">{daeun.order}대운</td>
                    <td className="py-2 px-1 text-center">
                      {daeun.startAge}~{daeun.endAge}
                    </td>
                    <td className="py-2 px-1 text-center font-medium">
                      {daeun.stemBranch.hangul}
                    </td>
                    <td className="py-2 px-1 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          ELEMENT_COLORS[daeun.stemBranch.stem.element]
                        )}
                      >
                        {daeun.stemSipsung.name}
                      </Badge>
                    </td>
                    <td className="py-2 px-1 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          ELEMENT_COLORS[daeun.stemBranch.branch.element]
                        )}
                      >
                        {daeun.branchSipsung.name}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
