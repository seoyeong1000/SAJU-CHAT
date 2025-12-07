CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) master_logic_definitions
CREATE TABLE IF NOT EXISTS public.master_logic_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logic_key TEXT NOT NULL,
  domain TEXT NOT NULL,
  subdomain TEXT,
  name_ko TEXT,
  category TEXT,
  calc_type TEXT,
  calc_params JSONB,
  conflict_group TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  lang TEXT NOT NULL DEFAULT 'ko',
  desc_core TEXT,
  UNIQUE (logic_key),
  UNIQUE (logic_key, domain, lang, version)
);

CREATE INDEX IF NOT EXISTS idx_master_logic_definitions_logic_key ON public.master_logic_definitions (logic_key);
CREATE INDEX IF NOT EXISTS idx_master_logic_definitions_domain ON public.master_logic_definitions (domain);
CREATE INDEX IF NOT EXISTS idx_master_logic_definitions_is_active ON public.master_logic_definitions (is_active);

-- 2) master_interpretations
CREATE TABLE IF NOT EXISTS public.master_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ext_id TEXT NOT NULL, -- original seed id (e.g., INTP_*)
  logic_key TEXT NOT NULL,
  domain TEXT NOT NULL,
  subdomain TEXT,
  layer TEXT,
  trust_level TEXT,
  priority INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  lang TEXT NOT NULL DEFAULT 'ko',
  title TEXT,
  content TEXT,
  example_scenario TEXT,
  source_ref TEXT,
  UNIQUE (ext_id)
);

CREATE INDEX IF NOT EXISTS idx_master_interpretations_logic_key ON public.master_interpretations (logic_key);
CREATE INDEX IF NOT EXISTS idx_master_interpretations_domain ON public.master_interpretations (domain);
CREATE INDEX IF NOT EXISTS idx_master_interpretations_is_active ON public.master_interpretations (is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_interpretations_unique_combo
  ON public.master_interpretations (logic_key, domain, COALESCE(subdomain, ''), COALESCE(layer, ''), lang, version);

-- 3) master_solutions
CREATE TABLE IF NOT EXISTS public.master_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ext_id TEXT NOT NULL,
  logic_key TEXT NOT NULL,
  domain TEXT NOT NULL,
  subdomain TEXT,
  layer TEXT,
  type TEXT,
  severity TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  lang TEXT NOT NULL DEFAULT 'ko',
  requires_disclaimer BOOLEAN NOT NULL DEFAULT false,
  title TEXT,
  content TEXT,
  product_hint JSONB,
  script TEXT,
  difficulty TEXT,
  time_required TEXT,
  source_ref TEXT,
  UNIQUE (ext_id)
);

CREATE INDEX IF NOT EXISTS idx_master_solutions_logic_key ON public.master_solutions (logic_key);
CREATE INDEX IF NOT EXISTS idx_master_solutions_domain ON public.master_solutions (domain);
CREATE INDEX IF NOT EXISTS idx_master_solutions_is_active ON public.master_solutions (is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_solutions_unique_combo
  ON public.master_solutions (logic_key, domain, COALESCE(subdomain, ''), COALESCE(layer, ''), lang, version);

-- 4) master_persona_vibe
CREATE TABLE IF NOT EXISTS public.master_persona_vibe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ext_id TEXT NOT NULL,
  logic_key TEXT,
  context_key TEXT,
  domain TEXT NOT NULL,
  subdomain TEXT,
  layer TEXT,
  persona_id TEXT,
  use_case TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  lang TEXT NOT NULL DEFAULT 'ko',
  text TEXT,
  source_ref TEXT,
  UNIQUE (ext_id)
);

CREATE INDEX IF NOT EXISTS idx_master_persona_vibe_logic_key ON public.master_persona_vibe (logic_key);
CREATE INDEX IF NOT EXISTS idx_master_persona_vibe_context_key ON public.master_persona_vibe (context_key);
CREATE INDEX IF NOT EXISTS idx_master_persona_vibe_domain ON public.master_persona_vibe (domain);
CREATE INDEX IF NOT EXISTS idx_master_persona_vibe_use_case ON public.master_persona_vibe (use_case);
CREATE INDEX IF NOT EXISTS idx_master_persona_vibe_is_active ON public.master_persona_vibe (is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_persona_vibe_unique_combo
  ON public.master_persona_vibe (
    COALESCE(logic_key, ''),
    COALESCE(context_key, ''),
    COALESCE(persona_id, ''),
    COALESCE(use_case, ''),
    lang,
    version
  );

-- Dev convenience: RLS off (prod에서 별도 정책 필요)
ALTER TABLE public.master_logic_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_interpretations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_solutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_persona_vibe DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.master_logic_definitions TO anon, authenticated, service_role;
GRANT ALL ON public.master_interpretations TO anon, authenticated, service_role;
GRANT ALL ON public.master_solutions TO anon, authenticated, service_role;
GRANT ALL ON public.master_persona_vibe TO anon, authenticated, service_role;
