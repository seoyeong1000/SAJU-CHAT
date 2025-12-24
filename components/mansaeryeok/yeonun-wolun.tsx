'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { HeavenlyStem, FiveElement, StemBranch, Sipsung } from '@/lib/manse'
import { calculateYeonunList, calculateWolunList } from '@/lib/manse'

// 오행 색상
const ELEMENT_COLORS: Record<FiveElement, string> = {
  wood: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  fire: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  earth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  metal: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  water: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}

interface YeonunWolunProps {
  dayMaster: HeavenlyStem
  currentYear?: number
}

export function YeonunWolun({ dayMaster, currentYear }: YeonunWolunProps) {
  const thisYear = currentYear || new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(thisYear)

  // 연운 목록 (현재 년도 전후 5년씩)
  const yeonunList = useMemo(() => {
    return calculateYeonunList(dayMaster, thisYear - 5, 11)
  }, [dayMaster, thisYear])

  // 월운 목록 (선택된 년도)
  const wolunList = useMemo(() => {
    return calculateWolunList(dayMaster, selectedYear)
  }, [dayMaster, selectedYear])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">연운 / 월운</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="yeonun">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yeonun">연운 (年運)</TabsTrigger>
            <TabsTrigger value="wolun">월운 (月運)</TabsTrigger>
          </TabsList>

          {/* 연운 탭 */}
          <TabsContent value="yeonun" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-center text-muted-foreground">년도</th>
                    <th className="py-2 px-2 text-center text-muted-foreground">간지</th>
                    <th className="py-2 px-2 text-center text-muted-foreground">천간</th>
                    <th className="py-2 px-2 text-center text-muted-foreground">지지</th>
                  </tr>
                </thead>
                <tbody>
                  {yeonunList.map((yeonun) => (
                    <tr
                      key={yeonun.year}
                      className={cn(
                        'border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors',
                        yeonun.year === thisYear && 'bg-primary/5',
                        yeonun.year === selectedYear && 'bg-primary/10'
                      )}
                      onClick={() => setSelectedYear(yeonun.year)}
                    >
                      <td className="py-3 px-2 text-center">
                        <span className={cn(
                          yeonun.year === thisYear && 'font-bold text-primary'
                        )}>
                          {yeonun.year}년
                          {yeonun.year === thisYear && ' (올해)'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-medium">
                        <span className="text-lg">{yeonun.stemBranch.hangul}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({yeonun.stemBranch.hanja})
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            ELEMENT_COLORS[yeonun.stemBranch.stem.element]
                          )}
                        >
                          {yeonun.stemSipsung.name}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            ELEMENT_COLORS[yeonun.stemBranch.branch.element]
                          )}
                        >
                          {yeonun.branchSipsung.name}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* 월운 탭 */}
          <TabsContent value="wolun" className="mt-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {selectedYear}년 월운
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className="px-2 py-1 text-sm border rounded hover:bg-muted"
                >
                  ◀ 이전 해
                </button>
                <button
                  onClick={() => setSelectedYear(thisYear)}
                  className="px-2 py-1 text-sm border rounded hover:bg-muted"
                >
                  올해
                </button>
                <button
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  className="px-2 py-1 text-sm border rounded hover:bg-muted"
                >
                  다음 해 ▶
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {wolunList.map((wolun) => {
                const currentMonth = new Date().getMonth() + 1
                const isCurrentMonth =
                  wolun.year === thisYear && wolun.month === currentMonth

                return (
                  <div
                    key={wolun.month}
                    className={cn(
                      'p-3 rounded-lg border text-center',
                      isCurrentMonth
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {wolun.month}월
                      {isCurrentMonth && ' (이번 달)'}
                    </div>
                    <div className="text-lg font-bold">
                      {wolun.stemBranch.hangul}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {wolun.stemBranch.hanja}
                    </div>
                    <div className="mt-2 flex justify-center gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs px-1',
                          ELEMENT_COLORS[wolun.stemBranch.stem.element]
                        )}
                      >
                        {wolun.stemSipsung.shortName}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs px-1',
                          ELEMENT_COLORS[wolun.stemBranch.branch.element]
                        )}
                      >
                        {wolun.branchSipsung.shortName}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
