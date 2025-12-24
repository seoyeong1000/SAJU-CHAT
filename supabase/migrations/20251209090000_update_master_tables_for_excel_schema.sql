-- Align master tables with latest Excel spec (master_interpretations, master_solutions, conversation_script)

-- master_interpretations: optional variant grouping + scripted response linkage
ALTER TABLE public.master_interpretations
  ADD COLUMN IF NOT EXISTS variant_type TEXT,
  ADD COLUMN IF NOT EXISTS script_id TEXT;

CREATE INDEX IF NOT EXISTS idx_master_interpretations_variant_type ON public.master_interpretations (variant_type);
CREATE INDEX IF NOT EXISTS idx_master_interpretations_script_id ON public.master_interpretations (script_id);

-- master_solutions: ensure product_hint JSONB is present + variant and script linkage
ALTER TABLE public.master_solutions
  ADD COLUMN IF NOT EXISTS product_hint JSONB,
  ADD COLUMN IF NOT EXISTS variant_type TEXT,
  ADD COLUMN IF NOT EXISTS script_id TEXT;

CREATE INDEX IF NOT EXISTS idx_master_solutions_variant_type ON public.master_solutions (variant_type);
CREATE INDEX IF NOT EXISTS idx_master_solutions_script_id ON public.master_solutions (script_id);

-- conversation_script: conversational flow blocks keyed by script_id
CREATE TABLE IF NOT EXISTS public.conversation_script (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  script_id TEXT NOT NULL,
  variant_type TEXT,
  step INT NOT NULL, -- turn order within a script
  role TEXT NOT NULL, -- e.g., assistant|user|system
  message TEXT NOT NULL, -- rendered text for the step
  metadata JSONB, -- optional JSON for tone, intent, etc.
  lang TEXT NOT NULL DEFAULT 'ko',
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_script_unique_combo
  ON public.conversation_script (
    script_id,
    COALESCE(variant_type, ''),
    lang,
    version,
    step
  );

CREATE INDEX IF NOT EXISTS idx_conversation_script_script_id ON public.conversation_script (script_id);
CREATE INDEX IF NOT EXISTS idx_conversation_script_variant_type ON public.conversation_script (variant_type);

-- Dev convenience: RLS off (add proper policies before prod)
ALTER TABLE public.conversation_script DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.conversation_script TO anon, authenticated, service_role;
