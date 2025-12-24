import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { Database, Json } from "../database.types";

type DbClient = SupabaseClient<Database>;
type RawCsvRow = Record<string, string>;

const CSV_DIR = path.join(process.cwd(), "data", "csvs");
const REQUIRED_ENV = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const RESET_CONVERSATION_SCRIPT = process.env.RESET_CONVERSATION_SCRIPT === "true";

function requireEnv(key: (typeof REQUIRED_ENV)[number]): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function createSupabaseClient(): DbClient {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function parseCsv(content: string): RawCsvRow[] {
  const rows: string[][] = [];
  const clean = content.replace(/^\uFEFF/, "");
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (inQuotes) {
      if (char === '"') {
        const nextChar = clean[i + 1];
        if (nextChar === '"') {
          currentField += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      currentRow.push(currentField);
      currentField = "";
    } else if (char === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else if (char === "\r") {
      // Skip carriage returns (CRLF handling)
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  const [header, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => {
      const record: RawCsvRow = {};
      header.forEach((key, index) => {
        record[key] = row[index] ?? "";
      });
      return record;
    });
}

async function loadCsv(filename: string): Promise<RawCsvRow[]> {
  const filePath = path.join(CSV_DIR, filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return parseCsv(raw);
}

function toBoolean(value: string | undefined, fallback: boolean | null = null): boolean | null {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

function toNumber(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function emptyToNull(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function safeJsonParse(value: string | undefined): Json | null {
  if (!value || value.trim() === "") return null;
  try {
    return JSON.parse(value) as Json;
  } catch (error) {
    console.warn("Failed to parse JSON value, storing null instead:", value);
    console.warn(error);
    return null;
  }
}

function deriveDomain(logicKey: string | undefined): string {
  if (!logicKey) return "general";
  const [domain] = logicKey.split(".");
  return domain || "general";
}

function deriveSubdomain(logicKey: string | undefined): string | null {
  if (!logicKey) return null;
  const [, subdomain] = logicKey.split(".");
  return subdomain || null;
}

async function importInterpretations(client: DbClient) {
  const rows = await loadCsv("INTERPRETATION_BASE.csv");
  const payload = rows.map((row) => ({
    ext_id: row.id,
    logic_key: row.logic_key,
    domain: row.domain,
    subdomain: emptyToNull(row.subdomain),
    layer: emptyToNull(row.layer),
    trust_level: emptyToNull(row.trust_level),
    priority: toNumber(row.priority),
    lang: row.lang || "ko",
    is_active: toBoolean(row.is_active, true),
    version: toNumber(row.version) ?? 1,
    title: emptyToNull(row.title),
    content: emptyToNull(row.content_main),
    example_scenario: emptyToNull(row.one_line_summary),
  }));

  const { error } = await client.from("master_interpretations").upsert(payload, { onConflict: "ext_id" });
  if (error) throw new Error(`master_interpretations upsert failed: ${error.message}`);
  console.log(`master_interpretations upserted: ${payload.length}`);
}

async function importSolutions(client: DbClient) {
  const rows = await loadCsv("SOLUTION_ACTION.csv");
  const payload = rows.map((row) => ({
    ext_id: row.id,
    logic_key: row.logic_key,
    domain: row.domain,
    subdomain: emptyToNull(row.subdomain),
    layer: emptyToNull(row.layer),
    type: emptyToNull(row.type),
    severity: emptyToNull(row.severity),
    is_active: toBoolean(row.is_active, true),
    version: toNumber(row.version) ?? 1,
    lang: row.lang || "ko",
    title: emptyToNull(row.title),
    content: emptyToNull(row.content_detail),
    product_hint: safeJsonParse(row.product_hint),
    requires_disclaimer: false,
  }));

  // Deduplicate by unique index (logic_key, domain, coalesce(subdomain,''), coalesce(layer,''), lang, version)
  const dedupedMap = new Map<string, (typeof payload)[number]>();
  payload.forEach((item) => {
    const key = [
      item.logic_key ?? "",
      item.domain ?? "",
      item.subdomain ?? "",
      item.layer ?? "",
      item.lang ?? "ko",
      item.version ?? 1,
    ].join("||");
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, item);
    }
  });
  const deduped = Array.from(dedupedMap.values());

  const { error } = await client
    .from("master_solutions")
    .upsert(deduped, { onConflict: "ext_id" });
  if (error) throw new Error(`master_solutions upsert failed: ${error.message}`);
  console.log(`master_solutions upserted: ${deduped.length} (deduped from ${payload.length})`);
}

async function importPersonaVibe(client: DbClient) {
  const rows = await loadCsv("PERSONA_VIBE_HOOK.csv");
  const payload = rows.map((row) => ({
    ext_id: row.id,
    logic_key: emptyToNull(row.logic_key),
    context_key: emptyToNull(row.variant_type),
    domain: deriveDomain(row.logic_key),
    subdomain: deriveSubdomain(row.logic_key),
    layer: null,
    persona_id: emptyToNull(row.persona_id),
    use_case: emptyToNull(row.use_case),
    is_active: toBoolean(row.is_active, true),
    version: toNumber(row.version) ?? 1,
    lang: row.lang || "ko",
    text: emptyToNull(row.text),
    source_ref: emptyToNull(row.source_name),
  }));

  // Step 1: dedup by ext_id to avoid double-update in single statement
  const byExtId = new Map<string, (typeof payload)[number]>();
  payload.forEach((item) => {
    if (!item.ext_id) return;
    if (!byExtId.has(item.ext_id)) {
      byExtId.set(item.ext_id, item);
    }
  });

  // Step 2: dedup by unique index: coalesce(logic_key,''), coalesce(context_key,''), coalesce(persona_id,''),
  // coalesce(use_case,''), lang, version
  const dedupedMap = new Map<string, (typeof payload)[number]>();
  Array.from(byExtId.values()).forEach((item) => {
    const key = [
      item.logic_key ?? "",
      item.context_key ?? "",
      item.persona_id ?? "",
      item.use_case ?? "",
      item.lang ?? "ko",
      item.version ?? 1,
    ].join("||");
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, item);
    }
  });
  const deduped = Array.from(dedupedMap.values());

  const { error } = await client.from("master_persona_vibe").upsert(deduped, { onConflict: "ext_id" });
  if (error) throw new Error(`master_persona_vibe upsert failed: ${error.message}`);
  console.log(`master_persona_vibe upserted: ${deduped.length} (deduped from ${payload.length})`);
}

async function importConversationScripts(client: DbClient) {
  const rows = await loadCsv("CONVERSATION_SCRIPT.csv");
  const payload = rows.map((row) => ({
    script_id: row.script_id,
    variant_type: emptyToNull(row.variant_type),
    step: 1,
    role: "assistant",
    message: row.my_script,
    metadata: {
      domain: emptyToNull(row.domain),
      subdomain: emptyToNull(row.subdomain),
      situation: emptyToNull(row.situation),
      why_this_works: emptyToNull(row.why_this_works),
    },
    lang: "ko",
    version: 1,
    is_active: true,
  }));

  if (RESET_CONVERSATION_SCRIPT) {
    const { error: deleteError } = await client.from("conversation_script").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (deleteError) throw new Error(`conversation_script reset failed: ${deleteError.message}`);
  }

  const { error } = await client.from("conversation_script").insert(payload);
  if (error) throw new Error(`conversation_script insert failed: ${error.message}`);
  console.log(`conversation_script inserted: ${payload.length}`);
}

async function main() {
  const client = createSupabaseClient();

  await importInterpretations(client);
  await importSolutions(client);
  await importPersonaVibe(client);
  await importConversationScripts(client);

  console.log("CSV import completed.");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
