-- Chart analysis results table for Phase 2 Analysis Engine
-- Dev 환경: RLS 비활성화 (prod 전환 시 별도 마이그레이션에서 RLS 활성화)

CREATE TABLE IF NOT EXISTS public.chart_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id UUID NOT NULL REFERENCES public.bazi_saved_results(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL, -- clerk_id (소유권 확인용)
  logic_keys TEXT[] NOT NULL DEFAULT '{}',
  summary JSONB NOT NULL DEFAULT '{}',
  ruleset_version TEXT NOT NULL DEFAULT 'v7_2025_q1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: 하나의 chart_id당 하나의 분석 결과만 (ruleset_version별로)
CREATE UNIQUE INDEX IF NOT EXISTS idx_chart_analysis_results_chart_id_version 
  ON public.chart_analysis_results (chart_id, ruleset_version);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chart_analysis_results_chart_id ON public.chart_analysis_results (chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_analysis_results_owner_id ON public.chart_analysis_results (owner_id);
CREATE INDEX IF NOT EXISTS idx_chart_analysis_results_ruleset_version ON public.chart_analysis_results (ruleset_version);
CREATE INDEX IF NOT EXISTS idx_chart_analysis_results_created_at ON public.chart_analysis_results (created_at DESC);

-- GIN index for array searches (logic_keys)
CREATE INDEX IF NOT EXISTS idx_chart_analysis_results_logic_keys_gin 
  ON public.chart_analysis_results USING GIN (logic_keys);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chart_analysis_results_updated_at
  BEFORE UPDATE ON public.chart_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS disabled for dev/stage
ALTER TABLE public.chart_analysis_results DISABLE ROW LEVEL SECURITY;

-- Basic grants (dev convenience; tighten in prod)
GRANT ALL ON public.chart_analysis_results TO anon, authenticated, service_role;

