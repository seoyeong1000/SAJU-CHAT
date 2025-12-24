'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Sinsal } from '@/lib/manse'

interface SinshalBadgesProps {
  sinsals: Sinsal[]
  showDescription?: boolean
}

export function SinshalBadges({ sinsals, showDescription = true }: SinshalBadgesProps) {
  // 길성과 흉살 분리
  const gilsung = sinsals.filter((s) => s.type === 'gilsung')
  const hyungsal = sinsals.filter((s) => s.type === 'hyungsal')

  if (sinsals.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">신살과 길성</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 길성 */}
        {gilsung.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              길성 (吉星)
            </h4>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                {gilsung.map((sinsal) => (
                  <Tooltip key={sinsal.code}>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="default"
                        className="cursor-help bg-emerald-600 hover:bg-emerald-700"
                      >
                        {sinsal.name} ({sinsal.hanja})
                      </Badge>
                    </TooltipTrigger>
                    {showDescription && sinsal.description && (
                      <TooltipContent className="max-w-xs">
                        <p>{sinsal.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* 흉살 */}
        {hyungsal.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              흉살 (凶殺)
            </h4>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                {hyungsal.map((sinsal) => (
                  <Tooltip key={sinsal.code}>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="destructive"
                        className="cursor-help"
                      >
                        {sinsal.name} ({sinsal.hanja})
                      </Badge>
                    </TooltipTrigger>
                    {showDescription && sinsal.description && (
                      <TooltipContent className="max-w-xs">
                        <p>{sinsal.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* 상세 설명 (펼침) */}
        {showDescription && (
          <SinshalDetailList sinsals={sinsals} />
        )}
      </CardContent>
    </Card>
  )
}

// 신살 상세 목록
function SinshalDetailList({ sinsals }: { sinsals: Sinsal[] }) {
  const [expanded, setExpanded] = useState(false)

  if (sinsals.length === 0) return null

  return (
    <div className="pt-4 border-t">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? '설명 접기 ▲' : '상세 설명 보기 ▼'}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {sinsals.map((sinsal) => (
            <div
              key={sinsal.code}
              className={cn(
                'p-3 rounded-lg border',
                sinsal.type === 'gilsung'
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
              )}
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={sinsal.type === 'gilsung' ? 'default' : 'destructive'}
                  className={cn(
                    sinsal.type === 'gilsung' && 'bg-emerald-600'
                  )}
                >
                  {sinsal.type === 'gilsung' ? '길성' : '흉살'}
                </Badge>
                <span className="font-medium">
                  {sinsal.name} ({sinsal.hanja})
                </span>
              </div>
              {sinsal.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {sinsal.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 컴팩트 버전 (인라인)
export function SinshalBadgesCompact({ sinsals }: { sinsals: Sinsal[] }) {
  if (sinsals.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      <TooltipProvider>
        {sinsals.map((sinsal) => (
          <Tooltip key={sinsal.code}>
            <TooltipTrigger asChild>
              <Badge
                variant={sinsal.type === 'gilsung' ? 'default' : 'destructive'}
                className={cn(
                  'text-xs cursor-help',
                  sinsal.type === 'gilsung' && 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {sinsal.name}
              </Badge>
            </TooltipTrigger>
            {sinsal.description && (
              <TooltipContent className="max-w-xs">
                <p className="font-medium">{sinsal.name} ({sinsal.hanja})</p>
                <p className="text-sm mt-1">{sinsal.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
}
