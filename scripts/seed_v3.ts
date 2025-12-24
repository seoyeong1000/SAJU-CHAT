// scripts/seed_v3.ts
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import * as dotenv from 'dotenv'

// .env.local 로드
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 파일명 매핑 (data 폴더에 있는 실제 파일명으로 수정 필요 시 여기를 고치세요)
// 사장님이 가진 파일명과 최대한 비슷하게 맞췄습니다.
const FILES = {
    interpretation: 'interpretation.csv',
    solution: 'solution.csv',
    script: 'conversation.csv',
    persona: 'persona.csv'
}

// 헬퍼 함수
const safeJson = (str: string) => {
  if (!str || str === '[]' || str === '{}') return null
  try { return JSON.parse(str) } catch { return null }
}
const safeArray = (str: string) => {
  if (!str) return []
  try { 
    const res = JSON.parse(str)
    return Array.isArray(res) ? res : []
  } catch { return [] }
}
const safeBool = (val: string) => val === 'TRUE' || val === 'True' || val === 'true'

async function seedTable(tableName: string, fileName: string, transformFn: (row: any) => any) {
  const filePath = path.join(process.cwd(), 'data', fileName)
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 파일 없음: ${filePath} (data 폴더를 확인하세요)`)
    return
  }

  console.log(`📥 [${tableName}] 적재 시작...`)
  const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '') // BOM 제거
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true })

  console.log(`   - ${records.length}개 데이터 발견. DB 업로드 중...`)
  
  let success = 0
  let fail = 0

  // 한 번에 너무 많이 보내면 터질 수 있으니 50개씩 끊어서 보냄
  const CHUNK_SIZE = 50
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE).map(transformFn)
    const { error } = await supabase.from(tableName).upsert(chunk, { onConflict: 'id' })
    if (error) {
      console.error(`   ❌ 오류 발생: ${error.message}`)
      fail += chunk.length
    } else {
      success += chunk.length
    }
  }
  console.log(`   ✅ 완료: 성공 ${success}, 실패 ${fail}\n`)
}

async function main() {
  console.log('🚀 사주 데이터 적재(Seeding) 시작...\n')

  // 1. 해석 데이터
  await seedTable('interpretation_base', FILES.interpretation, (row) => ({
    id: row.id,
    logic_key: row.logic_key,
    domain: row.domain,
    subdomain: row.subdomain,
    layer: row.layer || 'core',
    title: row.title,
    one_line_summary: row.one_line_summary,
    content_sections: safeJson(row.content_sections) || {},
    free_sections: safeArray(row.free_sections),
    tone: row.tone,
    trust_level: row.trust_level,
    priority: parseInt(row.priority) || 1,
    lang: row.lang || 'ko',
    is_active: safeBool(row.is_active),
    version: parseInt(row.version) || 1,
    source_ref: row.source_ref,
    access_tier: row.access_tier || 'both'
  }))

  // 2. 행동 지침
  await seedTable('solution_action', FILES.solution, (row) => ({
    id: row.id,
    logic_key: row.logic_key,
    domain: row.domain,
    subdomain: row.subdomain,
    type: row.type,
    severity: row.severity || 'all',
    title: row.title,
    content_detail: row.content_detail,
    content_sections: safeJson(row.content_sections),
    product_hint: safeJson(row.product_hint),
    is_active: safeBool(row.is_active),
    access_tier: row.access_tier || 'both'
  }))

  // 3. 대화 스크립트
  await seedTable('conversation_script', FILES.script, (row) => ({
    id: row.id,
    logic_key: row.logic_key,
    domain: row.domain,
    subdomain: row.subdomain,
    layer: row.layer || 'script',
    title: row.title,
    content_sections: safeJson(row.content_sections) || {},
    free_sections: safeArray(row.free_sections),
    is_active: safeBool(row.is_active),
    access_tier: row.access_tier || 'paid'
  }))

  // 4. 페르소나
  await seedTable('persona_vibe_hook', FILES.persona, (row) => ({
    id: row.id,
    logic_key: row.logic_key,
    persona_id: row.persona_id,
    use_case: row.use_case,
    text: row.text,
    tone_note: row.tone_note,
    priority: parseFloat(row.priority) || 1.0,
    is_active: safeBool(row.is_active),
    is_marketing_free: safeBool(row.is_marketing_free)
  }))

  console.log('🎉 모든 작업 완료!')
}

main()