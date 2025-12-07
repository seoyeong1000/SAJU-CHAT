CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.bazi_saved_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  source_action TEXT NOT NULL CHECK (source_action IN ('save', 'consult')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bazi_saved_results DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bazi_saved_results_clerk_id ON public.bazi_saved_results (clerk_id);
CREATE INDEX IF NOT EXISTS idx_bazi_saved_results_created_at ON public.bazi_saved_results (created_at DESC);

GRANT ALL ON public.bazi_saved_results TO anon;
GRANT ALL ON public.bazi_saved_results TO authenticated;
GRANT ALL ON public.bazi_saved_results TO service_role;
