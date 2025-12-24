'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OhhaengDistribution, SinGangYakAnalysis, FiveElement } from '@/lib/manse'

// 오행 색상
const OHHAENG_COLORS: Record<FiveElement, string> = {
  wood: '#22c55e', // green
  fire: '#ef4444', // red
  earth: '#eab308', // yellow
  metal: '#6b7280', // gray
  water: '#3b82f6', // blue
}

// 오행 한글 이름
const OHHAENG_NAMES: Record<FiveElement, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
}

interface OhhaengChartProps {
  distribution: OhhaengDistribution
  sinGangYak?: SinGangYakAnalysis
  yongsin?: { element: FiveElement; description: string }
}

export function OhhaengChart({ distribution, sinGangYak, yongsin }: OhhaengChartProps) {
  // 차트 데이터 생성
  const chartData = useMemo(() => {
    const elements: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water']
    return elements.map((element) => ({
      name: OHHAENG_NAMES[element],
      value: Math.round(distribution[element] * 10) / 10,
      color: OHHAENG_COLORS[element],
      element,
    }))
  }, [distribution])

  // 퍼센트 계산
  const percentData = useMemo(() => {
    const total = distribution.total || 1
    return chartData.map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }))
  }, [chartData, distribution.total])

  // 가장 강한/약한 오행
  const strongestElement = useMemo(() => {
    return percentData.reduce((max, item) => (item.value > max.value ? item : max))
  }, [percentData])

  const weakestElement = useMemo(() => {
    return percentData.reduce((min, item) => (item.value < min.value ? item : min))
  }, [percentData])

  // 신강/신약 텍스트
  const sinGangYakText = useMemo(() => {
    if (!sinGangYak) return null
    switch (sinGangYak.result) {
      case 'singang':
        return '신강(身强)'
      case 'sinyak':
        return '신약(身弱)'
      case 'junghwa':
        return '중화(中和)'
      default:
        return null
    }
  }, [sinGangYak])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">오행 분석</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 파이 차트 */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={percentData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${percent}%`}
                labelLine={false}
              >
                {percentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}`, '점수']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 오행 분포 바 */}
        <div className="mt-4 space-y-2">
          {percentData.map((item) => (
            <div key={item.element} className="flex items-center gap-2">
              <div className="w-16 text-sm text-muted-foreground">{item.name}</div>
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${item.percent}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div className="w-12 text-sm text-right">{item.percent}%</div>
            </div>
          ))}
        </div>

        {/* 요약 정보 */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-muted-foreground">가장 강한 오행</div>
            <div className="font-medium" style={{ color: strongestElement.color }}>
              {strongestElement.name} ({strongestElement.percent}%)
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-muted-foreground">가장 약한 오행</div>
            <div className="font-medium" style={{ color: weakestElement.color }}>
              {weakestElement.name} ({weakestElement.percent}%)
            </div>
          </div>
        </div>

        {/* 신강/신약 정보 */}
        {sinGangYak && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">신강신약지수</span>
              <span className="font-bold text-lg">{sinGangYakText}</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${sinGangYak.score}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>신약 (0)</span>
              <span>중화 (50)</span>
              <span>신강 (100)</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{sinGangYak.description}</p>
          </div>
        )}

        {/* 용신 정보 */}
        {yongsin && (
          <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                용신(用神)
              </span>
              <span
                className="px-2 py-0.5 rounded text-sm font-bold text-white"
                style={{ backgroundColor: OHHAENG_COLORS[yongsin.element] }}
              >
                {OHHAENG_NAMES[yongsin.element]}
              </span>
            </div>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {yongsin.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
