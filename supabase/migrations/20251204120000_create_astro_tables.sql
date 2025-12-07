-- Astro request/result/error logging tables for Bazi engine
-- Dev 환경: RLS 비활성화 (prod 전환 시 별도 마이그레이션에서 RLS 활성화 및 owner_id 추가)

-- Dev cleanup: ensure schema matches by recreating tables (safe for dev/stage)
DROP TABLE IF EXISTS public.astro_error_log CASCADE;
DROP TABLE IF EXISTS public.astro_result CASCADE;
DROP TABLE IF EXISTS public.astro_request CASCADE;

CREATE TABLE IF NOT EXISTS public.astro_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.astro_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.astro_request(id) ON DELETE CASCADE,
  output_json JSONB NOT NULL,
  engine_type TEXT NOT NULL CHECK (engine_type IN ('swiss-v2', 'swisseph-wasm', 'date-chinese')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.astro_error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.astro_request(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  stack TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_astro_request_created_at ON public.astro_request (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_astro_result_request_id ON public.astro_result (request_id);
CREATE INDEX IF NOT EXISTS idx_astro_result_created_at ON public.astro_result (created_at DESC);

-- RLS disabled for dev/stage
ALTER TABLE public.astro_request DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.astro_result DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.astro_error_log DISABLE ROW LEVEL SECURITY;

-- basic grants (dev convenience; tighten in prod)
GRANT ALL ON public.astro_request TO anon, authenticated, service_role;
GRANT ALL ON public.astro_result TO anon, authenticated, service_role;
GRANT ALL ON public.astro_error_log TO anon, authenticated, service_role;
