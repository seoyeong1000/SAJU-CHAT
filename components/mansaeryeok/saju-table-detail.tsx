'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  FourPillars,
  HeavenlyStem,
  Sipsung,
  TwelveStage,
  Sinsal,
  FiveElement,
} from '@/lib/manse'
import {
  calculateStemSipsung,
  calculateBranchSipsung,
  calculateHiddenStemsSipsung,
  calculateTwelveStage,
  calculatePillarSinsals,
  HEAVENLY_STEMS,
} from '@/lib/manse'

// 오행 색상
const ELEMENT_COLORS: Record<FiveElement, string> = {
  wood: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700',
  fire: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700',
  earth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  metal: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600',
  water: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
}

const ELEMENT_BG: Record<FiveElement, string> = {
  wood: 'bg-green-50 dark:bg-green-950/50',
  fire: 'bg-red-50 dark:bg-red-950/50',
  earth: 'bg-yellow-50 dark:bg-yellow-950/50',
  metal: 'bg-gray-50 dark:bg-gray-900/50',
  water: 'bg-blue-50 dark:bg-blue-950/50',
}

interface PillarInfo {
  label: string
  stem: { hangul: string; hanja: string; element: FiveElement } | null
  branch: { hangul: string; hanja: string; element: FiveElement; hiddenStems: string[] } | null
  stemSipsung: Sipsung | null
  branchSipsung: Sipsung | null
  twelveStage: TwelveStage | null
  hiddenStems: Array<{ stem: HeavenlyStem; sipsung: Sipsung }>
  sinsals: Sinsal[]
  isDay?: boolean
  isUnknown?: boolean
}

interface SajuTableDetailProps {
  pillars: FourPillars
  dayMaster: HeavenlyStem | null
  timeUnknown?: boolean
}

export function SajuTableDetail({
  pillars,
  dayMaster,
  timeUnknown = false,
}: SajuTableDetailProps) {
  // 각 기둥의 상세 정보 계산
  const pillarInfos = useMemo<PillarInfo[]>(() => {
    if (!dayMaster) return []

    const getPillarInfo = (
      pillarType: 'year' | 'month' | 'day' | 'hour',
      label: string,
      isDay = false,
      isUnknown = false
    ): PillarInfo => {
      const pillar = pillars[pillarType]

      if (!pillar || isUnknown) {
        return {
          label,
          stem: null,
          branch: null,
          stemSipsung: null,
          branchSipsung: null,
          twelveStage: null,
          hiddenStems: [],
          sinsals: [],
          isDay,
          isUnknown,
        }
      }

      const stem = pillar.stem
        ? {
            hangul: pillar.stem.hangul,
            hanja: pillar.stem.hanja,
            element: pillar.stem.element,
          }
        : null

      const branch = pillar.branch
        ? {
            hangul: pillar.branch.hangul,
            hanja: pillar.branch.hanja,
            element: pillar.branch.element,
            hiddenStems: pillar.branch.hiddenStems,
          }
        : null

      // 십성 계산 (일간 자신은 제외)
      const stemSipsung =
        pillar.stem && !isDay
          ? calculateStemSipsung(dayMaster, pillar.stem)
          : null

      const branchSipsung = pillar.branch
        ? calculateBranchSipsung(dayMaster, pillar.branch)
        : null

      // 12운성 계산
      const twelveStage =
        pillar.branch && dayMaster
          ? calculateTwelveStage(dayMaster, pillar.branch)
          : null

      // 지장간 십성
      const hiddenStems = pillar.branch
        ? calculateHiddenStemsSipsung(dayMaster, pillar.branch)
        : []

      // 신살
      const sinsals = calculatePillarSinsals(pillars, dayMaster, pillarType)

      return {
        label,
        stem,
        branch,
        stemSipsung,
        branchSipsung,
        twelveStage,
        hiddenStems,
        sinsals,
        isDay,
        isUnknown,
      }
    }

    return [
      getPillarInfo('hour', '시주', false, timeUnknown),
      getPillarInfo('day', '일주', true),
      getPillarInfo('month', '월주'),
      getPillarInfo('year', '년주'),
    ]
  }, [pillars, dayMaster, timeUnknown])

  if (!dayMaster) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">상세 사주표</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border-b text-left text-sm text-muted-foreground w-20">
                  구분
                </th>
                {pillarInfos.map((info, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      'p-2 border-b text-center text-sm font-medium min-w-[80px]',
                      info.isDay && 'bg-primary/5'
                    )}
                  >
                    {info.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 천간 */}
              <tr>
                <td className="p-2 border-b text-sm text-muted-foreground">천간</td>
                {pillarInfos.map((info, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'p-2 border-b text-center',
                      info.isDay && 'bg-primary/5'
                    )}
                  >
                    {info.isUnknown ? (
                      <span className="text-2xl text-muted-foreground">?</span>
                    ) : info.stem ? (
                      <div
                        className={cn(
                          'inline-block px-3 py-2 rounded-lg border',
                          ELEMENT_COLORS[info.stem.element]
                        )}
                      >
                        <div className="text-2xl font-bold">{info.stem.hangul}</div>
                        <div className="text-xs">{info.stem.hanja}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                ))}
              </tr>

              {/* 천간 십성 */}
              <tr>
                <td className="p-2 border-b text-sm text-muted-foreground">십성</td>
                {pillarInfos.map((info, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'p-2 border-b text-center',
                      info.isDay && 'bg-primary/5'
                    )}
                  >
                    {info.isUnknown ? (
                      <span className="text-muted-foreground">-</span>
                    ) : info.isDay ? (
                      <Badge variant="secondary" className="text-xs">
                        일간
                      </Badge>
                    ) : info.stemSipsung ? (
                      <Badge variant="outline" className="text-xs">
                        {info.stemSipsung.name}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                ))}
              </tr>

              {/* 지지 */}
              <tr>
                <td className="p-2 border-b text-sm text-muted-foreground">지지</td>
                {pillarInfos.map((info, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'p-2 border-b text-center',
                      info.isDay && 'bg-primary/5'
                    )}
                  >
                    {info.isUnknown ? (
                      <span className="text-2xl text-muted-foreground">?</span>
                    ) : info.branch ? (
                      <div
                        className={cn(
                          'inline-block px-3 py-2 rounded-lg border',
                          ELEMENT_COLORS[info.branch.element]
                        )}
                      >
                        <div className="text-2xl font-bold">{info.branch.hangul}</div>
                        <div className="text-xs">{info.branch.hanja}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                ))}
              </tr>

              {/* 지지 십성 */}
              <tr>
                <td className="p-2 border-b text-sm text-muted-foreground">십성</td>
                {pillarInfos.map((info, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'p-2 border-b text-center',
                      info.isDay && 'bg-primary/5'
                    )}
                  >
                    {info.isUnknown ? (
                      <span className="text-muted-foreground">-</span>
                    ) : info.branchSipsung ? (
                      <Badge variant="outline" className="text-xs">
                        {info.branchSipsung.name}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                ))}
              </tr>

              {/* 지장간 */}
              <tr>
                <td className="p-2 border-b text-sm text-muted-foreground">지장간</td>
                {pillarInfos.map((info, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'p-2 border-b text-center',
                      info.isDay && 'bg-primary/5'
                    )}
                  >
                    {info.isUnknown ? (
                      <span className="text-muted-foreground">-</span>
                    ) : info.hiddenStems.length > 0 ? (
                      <div className="flex flex-col gap-1 items-center">
                        {info.hiddenStems.map((hs, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-xs',
                                ELEMENT_COLORS[hs.stem.element]
                              )}
                            >
                              {hs.stem.hangul}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {hs.sipsung.shortName}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                ))}
              </tr>

              {/* 12운성 */}
              <tr>
                <td className="p-2 border-b text-sm text-muted-foreground">12운성</td>
                {pillarInfos.map((info, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'p-2 border-b text-center',
                      info.isDay && 'bg-primary/5'
                    )}
                  >
                    {info.isUnknown ? (
                      <span className="text-muted-foreground">-</span>
                    ) : info.twelveStage ? (
                      <div className="text-sm">
                        <div className="font-medium">{info.twelveStage.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {info.twelveStage.hanja}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                ))}
              </tr>

              {/* 신살 */}
              <tr>
                <td className="p-2 text-sm text-muted-foreground">신살</td>
                {pillarInfos.map((info, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'p-2 text-center',
                      info.isDay && 'bg-primary/5'
                    )}
                  >
                    {info.isUnknown ? (
                      <span className="text-muted-foreground">-</span>
                    ) : info.sinsals.length > 0 ? (
                      <div className="flex flex-col gap-1 items-center">
                        {info.sinsals.slice(0, 3).map((sinsal, i) => (
                          <Badge
                            key={i}
                            variant={sinsal.type === 'gilsung' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {sinsal.name}
                          </Badge>
                        ))}
                        {info.sinsals.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{info.sinsals.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
