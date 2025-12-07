import { promises as fs } from "fs";
import path from "path";

import { createClient } from "@supabase/supabase-js";

type LogicDefinitionSeed = {
  logic_key: string;
  domain: string;
  subdomain?: string | null;
  name_ko?: string | null;
  category?: string | null;
  calc_type?: string | null;
  calc_params?: unknown;
  conflict_group?: string | null;
  is_active?: boolean;
  version?: number;
  lang?: string;
  desc_core?: string | null;
};

type InterpretationSeed = {
  id: string;
  logic_key: string;
  domain: string;
  subdomain?: string | null;
  layer?: string | null;
  trust_level?: string | null;
  priority?: number | null;
  is_active?: boolean;
  version?: number;
  lang?: string;
  title?: string | null;
  content?: string | null;
  example_scenario?: string | null;
  source_ref?: string | null;
};

type SolutionSeed = {
  id: string;
  logic_key: string;
  domain: string;
  subdomain?: string | null;
  layer?: string | null;
  type?: string | null;
  severity?: string | null;
  is_active?: boolean;
  version?: number;
  lang?: string;
  requires_disclaimer?: boolean;
  title?: string | null;
  content?: string | null;
  product_hint?: unknown;
  script?: string | null;
  difficulty?: string | null;
  time_required?: string | null;
  source_ref?: string | null;
};

type PersonaVibeSeed = {
  id: string;
  logic_key?: string | null;
  context_key?: string | null;
  domain: string;
  subdomain?: string | null;
  layer?: string | null;
  persona_id?: string | null;
  use_case?: string | null;
  is_active?: boolean;
  version?: number;
  lang?: string;
  text?: string | null;
  source_ref?: string | null;
};

const REQUIRED_ENV = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

const loadJson = async <T>(filename: string): Promise<T[]> => {
  const filePath = path.join(process.cwd(), "data", "seeds", filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T[];
};

const getSupabaseClient = () => {
  REQUIRED_ENV.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  });
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
};

async function seedLogicDefinitions() {
  const records = await loadJson<LogicDefinitionSeed>("master_logic_definitions.json");
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("master_logic_definitions")
    .upsert(
      records.map((item) => ({
        ...item,
        lang: item.lang ?? "ko",
        is_active: item.is_active ?? true,
      })),
      { onConflict: "logic_key" },
    );

  if (error) throw new Error(`master_logic_definitions upsert failed: ${error.message}`);
}

async function seedInterpretations() {
  const records = await loadJson<InterpretationSeed>("master_interpretations.json");
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("master_interpretations")
    .upsert(
      records.map((item) => ({
        ext_id: item.id,
        logic_key: item.logic_key,
        domain: item.domain,
        subdomain: item.subdomain ?? null,
        layer: item.layer ?? null,
        trust_level: item.trust_level ?? null,
        priority: item.priority ?? null,
        is_active: item.is_active ?? true,
        version: item.version ?? 1,
        lang: item.lang ?? "ko",
        title: item.title ?? null,
        content: item.content ?? null,
        example_scenario: item.example_scenario ?? null,
        source_ref: item.source_ref ?? null,
      })),
      { onConflict: "ext_id" },
    );

  if (error) throw new Error(`master_interpretations upsert failed: ${error.message}`);
}

async function seedSolutions() {
  const records = await loadJson<SolutionSeed>("master_solutions.json");
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("master_solutions")
    .upsert(
      records.map((item) => ({
        ext_id: item.id,
        logic_key: item.logic_key,
        domain: item.domain,
        subdomain: item.subdomain ?? null,
        layer: item.layer ?? null,
        type: item.type ?? null,
        severity: item.severity ?? null,
        is_active: item.is_active ?? true,
        version: item.version ?? 1,
        lang: item.lang ?? "ko",
        requires_disclaimer: item.requires_disclaimer ?? false,
        title: item.title ?? null,
        content: item.content ?? null,
        product_hint: item.product_hint ?? null,
        script: item.script ?? null,
        difficulty: item.difficulty ?? null,
        time_required: item.time_required ?? null,
        source_ref: item.source_ref ?? null,
      })),
      { onConflict: "ext_id" },
    );

  if (error) throw new Error(`master_solutions upsert failed: ${error.message}`);
}

async function seedPersonaVibe() {
  const records = await loadJson<PersonaVibeSeed>("master_persona_vibe.json");
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("master_persona_vibe")
    .upsert(
      records.map((item) => ({
        ext_id: item.id,
        logic_key: item.logic_key ?? null,
        context_key: item.context_key ?? null,
        domain: item.domain,
        subdomain: item.subdomain ?? null,
        layer: item.layer ?? null,
        persona_id: item.persona_id ?? null,
        use_case: item.use_case ?? null,
        is_active: item.is_active ?? true,
        version: item.version ?? 1,
        lang: item.lang ?? "ko",
        text: item.text ?? null,
        source_ref: item.source_ref ?? null,
      })),
      { onConflict: "ext_id" },
    );

  if (error) throw new Error(`master_persona_vibe upsert failed: ${error.message}`);
}

async function main() {
  try {
    await seedLogicDefinitions();
    console.log("master_logic_definitions seeded");
    await seedInterpretations();
    console.log("master_interpretations seeded");
    await seedSolutions();
    console.log("master_solutions seeded");
    await seedPersonaVibe();
    console.log("master_persona_vibe seeded");
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

void main();
