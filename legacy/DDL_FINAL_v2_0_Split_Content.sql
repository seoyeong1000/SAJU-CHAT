-- =========================================================
-- SAJU SERVICE - DATABASE DDL v2.0 (FINAL)
-- [안전장치] 기존 테이블 정리 후 4개로 분리 생성
-- =========================================================

-- 1. 기존에 잘못 생성된 테이블이나 구버전 테이블 삭제 (초기화)
DROP TABLE IF EXISTS public.saju_contents CASCADE;        -- 구버전 삭제
DROP TABLE IF EXISTS public.interpretation_base CASCADE;  -- 재설치를 위한 삭제
DROP TABLE IF EXISTS public.solution_action CASCADE;      -- 재설치를 위한 삭제
DROP TABLE IF EXISTS public.conversation_script CASCADE;  -- 재설치를 위한 삭제
DROP TABLE IF EXISTS public.persona_vibe_hook CASCADE;    -- 재설치를 위한 삭제

-- 2. 필수 확장 기능 활성화
create extension if not exists "pgcrypto";

-- 3. 업데이트 시간 자동 갱신 함수
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- [PART 1] 사용자 및 서비스 핵심 데이터 (User Side)
-- =========================================================

-- 1. 사용자 프로필
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- 2. 만세력 차트
create table if not exists public.saju_charts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text,
  input_json jsonb not null,
  result_json jsonb not null,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_saju_charts_updated_at before update on public.saju_charts
for each row execute function public.set_updated_at();

-- 3. 구매 권한 (Entitlements)
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id),
  product_type text not null,
  status text default 'active',
  bound_chart_id uuid references public.saju_charts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. 유료 리포트 결과
create table if not exists public.interpretation_reports (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid references public.entitlements(id),
  chart_id uuid references public.saju_charts(id),
  payload_json jsonb not null,
  tier text not null,
  created_at timestamptz not null default now()
);

-- 5. 채팅 세션 & 메시지 & 크레딧 로그
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id),
  entitlement_id uuid references public.entitlements(id),
  session_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id),
  amount int not null,
  reason text not null,
  created_at timestamptz not null default now()
);


-- =========================================================
-- [PART 2] 사주 콘텐츠 데이터 (System Side) - 4개 분리 적용
-- =========================================================

-- 6. 해석 데이터 (Interpretation Base)
create table if not exists public.interpretation_base (
  id text primary key,
  logic_key text not null,
  domain text not null,
  subdomain text,
  layer text default 'core',
  title text not null,
  one_line_summary text,
  content_sections jsonb not null,
  free_sections text[] default '{}',
  free_preview text,
  tone text default 'neutral',
  trust_level text default 'high',
  priority int default 1,
  lang text default 'ko',
  is_active boolean not null default true,
  version int default 1,
  source_ref text,
  timing_signals text[] default '{}',
  timing_window_hint text,
  requires_disclaimer boolean default false,
  disclaimer_type text,
  safety_tags text[] default '{}',
  access_tier text default 'both',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index ix_interp_logic on public.interpretation_base(logic_key);
create index ix_interp_domain on public.interpretation_base(domain, subdomain);

-- 7. 행동 지침 (Solution Action)
create table if not exists public.solution_action (
  id text primary key,
  logic_key text not null,
  domain text not null,
  subdomain text,
  type text not null,
  severity text default 'all',
  title text not null,
  title_display text,
  content_detail text not null,
  content_sections jsonb,
  free_sections text[] default '{}',
  risk_preview text,
  product_hint jsonb,
  source_ref text,
  timing_signals text[] default '{}',
  timing_window_hint text,
  requires_disclaimer boolean default false,
  disclaimer_type text,
  safety_tags text[] default '{}',
  access_tier text default 'both',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index ix_solution_logic on public.solution_action(logic_key);

-- 8. 대화 스크립트 (Conversation Script)
create table if not exists public.conversation_script (
  id text primary key,
  logic_key text not null,
  domain text not null,
  subdomain text,
  layer text default 'script',
  variant_type text,
  title text not null,
  content_sections jsonb not null,
  free_sections text[] default '{}',
  free_preview text,
  timing_signals text[] default '{}',
  timing_window_hint text,
  requires_disclaimer boolean default false,
  disclaimer_type text,
  safety_tags text[] default '{}',
  access_tier text default 'paid',
  is_active boolean not null default true,
  version int default 1,
  lang text default 'ko',
  source_ref text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index ix_script_logic on public.conversation_script(logic_key);

-- 9. 페르소나 훅 (Persona Vibe Hook)
create table if not exists public.persona_vibe_hook (
  id text primary key,
  logic_key text,
  persona_id text not null,
  use_case text not null,
  variant_type text,
  text text not null,
  tone_note text,
  priority float default 1.0,
  lang text default 'ko',
  is_active boolean not null default true,
  version float default 1.0,
  source_name text,
  source_ref text,
  access_tier text default 'both',
  is_marketing_free boolean default true,
  safety_tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index ix_persona_logic on public.persona_vibe_hook(logic_key);
create index ix_persona_id on public.persona_vibe_hook(persona_id, use_case);