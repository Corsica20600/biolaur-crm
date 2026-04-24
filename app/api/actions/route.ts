import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;
type ActionType = "appel" | "email" | "relance" | "visite" | "rendez_vous" | "note" | "reassort" | "prospection";
type ActionStatus = "a_faire" | "fait" | "annule";

type AutomationCandidate = {
  key: string;
  prospectClientId: string;
  actionType: ActionType;
  actionDateIso: string;
  summary: string;
  details: string;
  nextActionDateIso?: string;
  nextActionType?: ActionType;
};

type AutomationCampaign = {
  key: string;
  title: string;
  status: "brouillon";
  targetCount: number;
  subject: string;
  message: string;
};

type EmailSuggestion = {
  recipient: string;
  subject: string;
  message: string;
  templateCode: string;
  templateId?: string;
};

type ActionRowPayload = {
  id: string;
  ownerUserId: string;
  prospectClientId: string;
  clientName: string;
  actionType: ActionType;
  actionStatus: ActionStatus;
  actionDate: string;
  summary: string;
  details: string;
  nextActionDate: string;
  createdAt: string;
  updatedAt: string;
  automationKey?: string;
  suggestedEmail?: EmailSuggestion;
};

type AutomationStats = {
  createdCount: number;
  skippedDuplicateCount: number;
  skippedOptOutCount: number;
  generatedAt: string;
};

type ContextData = {
  prospects: DbRow[];
  actions: DbRow[];
  orders: DbRow[];
  emailLogs: DbRow[];
  templates: DbRow[];
};

const OPEN_STATUSES = new Set(["a_faire", "todo", "open"]);
const DONE_STATUSES = new Set(["fait", "annule", "done", "cancelled", "canceled", "closed"]);

function readField(row: DbRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined) return value;
  }
  return undefined;
}

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function parseDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(value: unknown) {
  const date = parseDate(value);
  return date ? date.toISOString() : "";
}

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function extractAutomationKey(text: string) {
  const match = text.match(/AUTO_KEY:([a-z0-9_:-]+)/i);
  return match?.[1]?.toLowerCase() ?? "";
}

function isMissingOwnerUserColumn(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("owner_user_id") && (lower.includes("column") || lower.includes("could not find"));
}

function extractMissingColumn(message: string) {
  const fromPostgrest = message.match(/Could not find the '([^']+)' column/i)?.[1];
  if (fromPostgrest) return fromPostgrest;
  const fromPostgres = message.match(/column "([^"]+)" of relation/i)?.[1] ?? message.match(/column "([^"]+)" does not exist/i)?.[1];
  return fromPostgres ?? null;
}

function normalizeActionStatus(row: DbRow): ActionStatus {
  const raw = asString(readField(row, "action_status", "statut")).toLowerCase();
  if (raw === "fait") return "fait";
  if (raw === "annule") return "annule";
  if (DONE_STATUSES.has(raw)) return raw === "annule" ? "annule" : "fait";
  return "a_faire";
}

function isOpenAction(row: DbRow) {
  const raw = asString(readField(row, "action_status", "statut")).toLowerCase();
  if (!raw) return true;
  if (DONE_STATUSES.has(raw)) return false;
  return OPEN_STATUSES.has(raw) || raw === "a_faire";
}

function normalizeActionType(row: DbRow): ActionType {
  const fallback = asString(readField(row, "action_type", "type")).toLowerCase();
  const legacyType = asString(readField(row, "type")).toLowerCase();
  if (legacyType === "reassort" || legacyType === "prospection") return legacyType;
  if (fallback === "visite" || fallback === "relance" || fallback === "email" || fallback === "rendez_vous" || fallback === "note") return fallback;
  return "appel";
}

function isOptOut(row: DbRow) {
  const value = readField(row, "opt_out", "ne_plus_contacter", "do_not_contact", "blacklisted");
  if (typeof value === "boolean") return value;
  const normalized = asString(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "oui" || normalized === "yes";
}

function getContactEmail(row: DbRow) {
  return asString(readField(row, "email", "contact_email", "mail"));
}

function buildActionInsertPayload(ownerUserId: string, candidate: AutomationCandidate) {
  const isExtendedType = candidate.actionType === "reassort" || candidate.actionType === "prospection";
  const actionType = isExtendedType ? "relance" : candidate.actionType;
  const nextActionType = candidate.nextActionType
    ? candidate.nextActionType === "reassort" || candidate.nextActionType === "prospection"
      ? "relance"
      : candidate.nextActionType
    : null;

  return {
    owner_user_id: ownerUserId,
    owner_id: ownerUserId,
    prospect_client_id: candidate.prospectClientId,
    action_type: actionType,
    type: candidate.actionType,
    action_status: "a_faire",
    statut: "a_faire",
    action_date: candidate.actionDateIso,
    date_action: candidate.actionDateIso,
    summary: candidate.summary,
    compte_rendu: candidate.summary,
    details: `AUTO_KEY:${candidate.key}\n${candidate.details}`,
    prochaine_action: `AUTO_KEY:${candidate.key}\n${candidate.details}`,
    next_action_type: nextActionType,
    next_action_date: candidate.nextActionDateIso ?? null,
    date_prochaine_action: candidate.nextActionDateIso ?? null
  };
}

async function insertCommercialActionCompat(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown>) {
  const workingPayload: Record<string, unknown> = { ...payload };
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const { error } = await supabase.from("commercial_actions").insert(workingPayload);
    if (!error) return;

    const missingColumn = extractMissingColumn(error.message ?? "");
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }
    throw new Error(error.message ?? "Insertion commercial_actions impossible.");
  }
  throw new Error("Insertion commercial_actions impossible: compatibilite schema epuisee.");
}

async function fetchOwnedRows(supabase: ReturnType<typeof createAdminClient>, table: string, userId: string, orderByColumn?: string) {
  const base = supabase.from(table).select("*").eq("owner_user_id", userId);
  const primary = orderByColumn ? await base.order(orderByColumn, { ascending: false }) : await base;
  if (!primary.error) return primary;

  if (isMissingOwnerUserColumn(primary.error.message ?? "")) {
    const fallbackBase = supabase.from(table).select("*").eq("owner_id", userId);
    return orderByColumn ? await fallbackBase.order(orderByColumn, { ascending: false }) : fallbackBase;
  }

  return primary;
}

async function loadContext(supabase: ReturnType<typeof createAdminClient>, userId: string): Promise<ContextData> {
  const [prospectsResult, actionsResult, ordersResult, emailLogsResult, templatesResult] = await Promise.all([
    fetchOwnedRows(supabase, "prospects_clients", userId, "updated_at"),
    fetchOwnedRows(supabase, "commercial_actions", userId, "created_at"),
    fetchOwnedRows(supabase, "orders", userId, "created_at"),
    fetchOwnedRows(supabase, "email_logs", userId, "created_at"),
    supabase.from("email_templates").select("*").eq("is_active", true)
  ]);

  const firstError = prospectsResult.error ?? actionsResult.error ?? ordersResult.error ?? emailLogsResult.error ?? templatesResult.error;
  if (firstError) throw new Error(firstError.message);

  return {
    prospects: (prospectsResult.data ?? []) as DbRow[],
    actions: (actionsResult.data ?? []) as DbRow[],
    orders: (ordersResult.data ?? []) as DbRow[],
    emailLogs: (emailLogsResult.data ?? []) as DbRow[],
    templates: (templatesResult.data ?? []) as DbRow[]
  };
}

function prospectName(row: DbRow) {
  return asString(readField(row, "trade_name", "company_name", "name")) || "Client";
}

function campaignTemplate(title: string, targetCount: number, subject: string, message: string): AutomationCampaign {
  return {
    key: title.toLowerCase().replaceAll(" ", "_"),
    title,
    status: "brouillon",
    targetCount,
    subject,
    message
  };
}

function buildCampaigns(context: ContextData, now: Date) {
  const lastOrderByProspectId = new Map<string, Date>();
  for (const order of context.orders) {
    const prospectClientId = asString(readField(order, "prospect_client_id", "client_id"));
    if (!prospectClientId) continue;
    const orderDate = parseDate(readField(order, "order_date", "created_at"));
    if (!orderDate) continue;
    const current = lastOrderByProspectId.get(prospectClientId);
    if (!current || current < orderDate) lastOrderByProspectId.set(prospectClientId, orderDate);
  }

  const isDormantClient = (prospect: DbRow) => {
    if (asString(readField(prospect, "record_type", "type")) !== "client") return false;
    const id = asString(readField(prospect, "id"));
    const lastOrderDate = lastOrderByProspectId.get(id);
    if (!lastOrderDate) return false;
    const diffDays = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 45;
  };

  return [
    campaignTemplate(
      "Prospection CHR",
      context.prospects.filter((row) => !isOptOut(row) && getContactEmail(row) && asString(readField(row, "record_type")) === "prospect" && asString(readField(row, "client_type")) === "CHR").length,
      "Solutions hygiene CHR: proposition de decouverte",
      "Bonjour, nous pouvons vous proposer une selection adaptee a votre etablissement. Repondez a ce message pour planifier un appel de 10 minutes."
    ),
    campaignTemplate(
      "Collectivites",
      context.prospects.filter((row) => !isOptOut(row) && getContactEmail(row) && asString(readField(row, "client_type")) === "collectivite").length,
      "Offre hygiene et entretien pour collectivites",
      "Bonjour, nous pouvons vous partager une proposition dediee aux besoins des collectivites. Souhaitez-vous recevoir une recommandation personnalisee ?"
    ),
    campaignTemplate(
      "Commerces de bouche",
      context.prospects.filter((row) => !isOptOut(row) && getContactEmail(row) && asString(readField(row, "client_type")) === "commerce_de_bouche").length,
      "Selection produits pour commerces de bouche",
      "Bonjour, nous avons prepare une selection orientee nettoyage et hygiene pour commerces de bouche. Dites-nous vos priorites et nous adaptons la proposition."
    ),
    campaignTemplate(
      "Clients dormants",
      context.prospects.filter((row) => !isOptOut(row) && getContactEmail(row) && isDormantClient(row)).length,
      "Nous reprenons le suivi de vos approvisionnements",
      "Bonjour, nous revenons vers vous pour vous proposer un point rapide sur vos besoins actuels et vos frequences de reapprovisionnement."
    ),
    campaignTemplate(
      "Reassort produits",
      context.prospects.filter((row) => !isOptOut(row) && getContactEmail(row) && isDormantClient(row)).length,
      "Reassort recommande selon vos commandes precedentes",
      "Bonjour, nous avons prepare une proposition de reassort basee sur vos dernieres commandes. Souhaitez-vous que nous la partagions ?"
    )
  ];
}

function maybeCreateCandidate(
  candidates: Map<string, AutomationCandidate>,
  openKeys: Set<string>,
  candidate: AutomationCandidate,
  isOptOutContact: boolean,
  stats: { skippedDuplicateCount: number; skippedOptOutCount: number }
) {
  const key = candidate.key.toLowerCase();
  if (isOptOutContact) {
    stats.skippedOptOutCount += 1;
    return;
  }
  if (openKeys.has(key) || candidates.has(key)) {
    stats.skippedDuplicateCount += 1;
    return;
  }
  candidates.set(key, candidate);
}

function buildAutomationCandidates(context: ContextData, now: Date) {
  const candidates = new Map<string, AutomationCandidate>();
  const stats = { skippedDuplicateCount: 0, skippedOptOutCount: 0 };

  const actionsByProspectId = new Map<string, DbRow[]>();
  const openKeys = new Set<string>();
  for (const action of context.actions) {
    const prospectClientId = asString(readField(action, "prospect_client_id"));
    if (!prospectClientId) continue;
    const bucket = actionsByProspectId.get(prospectClientId) ?? [];
    bucket.push(action);
    actionsByProspectId.set(prospectClientId, bucket);
    if (isOpenAction(action)) {
      const keyFromSummary = extractAutomationKey(asString(readField(action, "summary", "compte_rendu")));
      const keyFromDetails = extractAutomationKey(asString(readField(action, "details", "prochaine_action")));
      const key = keyFromSummary || keyFromDetails;
      if (key) openKeys.add(key);
    }
  }

  const ordersByProspectId = new Map<string, DbRow[]>();
  for (const order of context.orders) {
    const prospectClientId = asString(readField(order, "prospect_client_id", "client_id"));
    if (!prospectClientId) continue;
    const bucket = ordersByProspectId.get(prospectClientId) ?? [];
    bucket.push(order);
    ordersByProspectId.set(prospectClientId, bucket);
  }

  const emailsByProspectId = new Map<string, DbRow[]>();
  for (const email of context.emailLogs) {
    const prospectClientId = asString(readField(email, "prospect_client_id", "client_id"));
    if (!prospectClientId) continue;
    const bucket = emailsByProspectId.get(prospectClientId) ?? [];
    bucket.push(email);
    emailsByProspectId.set(prospectClientId, bucket);
  }

  for (const prospect of context.prospects) {
    const prospectClientId = asString(readField(prospect, "id"));
    if (!prospectClientId) continue;

    const optOut = isOptOut(prospect);
    const recordType = asString(readField(prospect, "record_type", "type")).toLowerCase();
    const name = prospectName(prospect);
    const createdAt = parseDate(readField(prospect, "created_at")) ?? now;

    const actionRows = actionsByProspectId.get(prospectClientId) ?? [];
    const emailRows = emailsByProspectId.get(prospectClientId) ?? [];
    const orderRows = ordersByProspectId.get(prospectClientId) ?? [];

    const lastActionDate = actionRows
      .map((row) => parseDate(readField(row, "action_date", "date_action", "created_at")))
      .filter((row): row is Date => Boolean(row))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const lastEmailDate = emailRows
      .map((row) => parseDate(readField(row, "sent_at", "created_at")))
      .filter((row): row is Date => Boolean(row))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const lastOrderDate = orderRows
      .map((row) => parseDate(readField(row, "order_date", "created_at")))
      .filter((row): row is Date => Boolean(row))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const hasAnyInteraction = Boolean(lastActionDate || lastEmailDate || lastOrderDate);
    const daysSinceLastAction = lastActionDate ? Math.floor((now.getTime() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24)) : Number.POSITIVE_INFINITY;
    const daysSinceLastOrder = lastOrderDate ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : Number.POSITIVE_INFINITY;

    if (recordType === "prospect" && !hasAnyInteraction) {
      const actionDate = addDays(createdAt, 1);
      maybeCreateCandidate(candidates, openKeys, { key: `prospect_j1:${prospectClientId}`, prospectClientId, actionType: "relance", actionDateIso: actionDate.toISOString(), summary: `Relance J+1 - ${name}`, details: "Prospect cree sans contact. Relancer sous 24h.", nextActionDateIso: addDays(actionDate, 2).toISOString(), nextActionType: "email" }, optOut, stats);
    }
    if (lastEmailDate) {
      const actionDate = addDays(lastEmailDate, 3);
      maybeCreateCandidate(candidates, openKeys, { key: `email_j3:${prospectClientId}:${lastEmailDate.toISOString().slice(0, 10)}`, prospectClientId, actionType: "relance", actionDateIso: actionDate.toISOString(), summary: `Relance J+3 apres email - ${name}`, details: "Verifier retour apres email envoye.", nextActionDateIso: addDays(actionDate, 4).toISOString(), nextActionType: "appel" }, optOut, stats);
    }
    if (lastOrderDate) {
      const actionDate = addDays(lastOrderDate, 15);
      maybeCreateCandidate(candidates, openKeys, { key: `order_j15:${prospectClientId}:${lastOrderDate.toISOString().slice(0, 10)}`, prospectClientId, actionType: "reassort", actionDateIso: actionDate.toISOString(), summary: `Suivi commande J+15 - ${name}`, details: "Suivi post-commande et proposition de reassort.", nextActionDateIso: addDays(actionDate, 7).toISOString(), nextActionType: "appel" }, optOut, stats);
    }
    if (recordType === "client" && Number.isFinite(daysSinceLastOrder) && daysSinceLastOrder >= 45) {
      maybeCreateCandidate(candidates, openKeys, { key: `client_dormant_45:${prospectClientId}`, prospectClientId, actionType: "reassort", actionDateIso: now.toISOString(), summary: `Relance reassort client dormant - ${name}`, details: "Client sans commande depuis 45 jours.", nextActionDateIso: addDays(now, 7).toISOString(), nextActionType: "appel" }, optOut, stats);
    }
    if (recordType === "prospect" && daysSinceLastAction >= 30) {
      maybeCreateCandidate(candidates, openKeys, { key: `prospect_inactive_30:${prospectClientId}`, prospectClientId, actionType: "prospection", actionDateIso: now.toISOString(), summary: `Relance prospection 30 jours - ${name}`, details: "Prospect sans action recente.", nextActionDateIso: addDays(now, 7).toISOString(), nextActionType: "appel" }, optOut, stats);
    }
  }

  return { candidates: Array.from(candidates.values()).sort((a, b) => a.actionDateIso.localeCompare(b.actionDateIso)), ...stats };
}

function pickTemplate(templates: DbRow[], preferredCodes: string[]) {
  const byCode = new Map<string, DbRow>();
  for (const template of templates) {
    const code = asString(readField(template, "code")).toLowerCase();
    if (code) byCode.set(code, template);
  }
  for (const code of preferredCodes) {
    const template = byCode.get(code);
    if (template) return { templateId: asString(readField(template, "id")), templateCode: asString(readField(template, "code")) };
  }
  const first = templates[0];
  return { templateId: first ? asString(readField(first, "id")) : "", templateCode: first ? asString(readField(first, "code")) : "" };
}

function buildEmailSuggestion(action: DbRow, prospect: DbRow | undefined, lastOrderDate: Date | null, templates: DbRow[]): EmailSuggestion | undefined {
  if (!prospect || isOptOut(prospect)) return undefined;
  const recipient = getContactEmail(prospect);
  if (!recipient) return undefined;

  const name = prospectName(prospect);
  const recordType = asString(readField(prospect, "record_type", "type"));
  const clientType = asString(readField(prospect, "client_type")) || "CHR";
  const actionType = normalizeActionType(action);
  const preferredCodes = actionType === "reassort" ? ["send_order", "send_sales_pack"] : actionType === "prospection" ? ["send_sales_pack", "send_account_opening"] : ["send_order", "send_account_opening"];
  const { templateCode, templateId } = pickTemplate(templates, preferredCodes);
  const lastOrderLabel = lastOrderDate ? lastOrderDate.toISOString().slice(0, 10) : "pas de commande recente";
  const subject = actionType === "reassort" ? `Proposition de reassort - ${name}` : actionType === "prospection" ? `Echange commercial ${clientType} - ${name}` : `Suivi commercial - ${name}`;
  const message = [
    "Bonjour,",
    "",
    recordType === "prospect" ? `Nous revenons vers vous pour poursuivre notre prise de contact (${actionType}).` : `Nous faisons un point de suivi commercial suite a nos derniers echanges (${actionType}).`,
    `Dernier achat: ${lastOrderLabel}.`,
    "Souhaitez-vous que nous vous proposions une recommandation adaptee ?",
    "",
    "Si vous ne souhaitez plus recevoir de sollicitations, repondez STOP a cet email.",
    "",
    "Bien cordialement"
  ].join("\n");

  return { recipient, subject, message, templateCode, templateId: templateId || undefined };
}

async function generateAutomations(supabase: ReturnType<typeof createAdminClient>, userId: string, mode: "load" | "manual"): Promise<{ stats: AutomationStats; context: ContextData; campaigns: AutomationCampaign[] }> {
  const now = new Date();
  const context = await loadContext(supabase, userId);
  const { candidates, skippedDuplicateCount, skippedOptOutCount } = buildAutomationCandidates(context, now);
  const maxCreates = mode === "load" ? 12 : 150;

  let createdCount = 0;
  for (const candidate of candidates.slice(0, maxCreates)) {
    await insertCommercialActionCompat(supabase, buildActionInsertPayload(userId, candidate));
    createdCount += 1;
  }

  const refreshedContext = createdCount > 0 ? await loadContext(supabase, userId) : context;
  return {
    stats: { createdCount, skippedDuplicateCount, skippedOptOutCount, generatedAt: now.toISOString() },
    context: refreshedContext,
    campaigns: buildCampaigns(refreshedContext, now)
  };
}

function mapAction(row: DbRow, clientName: string, templates: DbRow[], prospect: DbRow | undefined, lastOrderDate: Date | null): ActionRowPayload {
  const summary = asString(readField(row, "summary", "compte_rendu"));
  const details = asString(readField(row, "details", "prochaine_action"));
  const automationKey = extractAutomationKey(`${summary}\n${details}`) || undefined;

  return {
    id: asString(readField(row, "id")),
    ownerUserId: asString(readField(row, "owner_user_id", "owner_id")),
    prospectClientId: asString(readField(row, "prospect_client_id")),
    clientName,
    actionType: normalizeActionType(row),
    actionStatus: normalizeActionStatus(row),
    actionDate: toIso(readField(row, "action_date", "date_action", "created_at")),
    summary,
    details,
    nextActionDate: toIso(readField(row, "next_action_date", "date_prochaine_action")),
    createdAt: toIso(readField(row, "created_at")),
    updatedAt: toIso(readField(row, "updated_at", "created_at")),
    automationKey,
    suggestedEmail: buildEmailSuggestion(row, prospect, lastOrderDate, templates)
  };
}

function parseBodyMode(requestBody: unknown): "generate" | "complete" {
  if (!requestBody || typeof requestBody !== "object") return "generate";
  const mode = asString((requestBody as { mode?: unknown }).mode).toLowerCase();
  return mode === "complete" ? "complete" : "generate";
}

async function completeAction(supabase: ReturnType<typeof createAdminClient>, userId: string, actionId: string) {
  if (!actionId) return { ok: false, error: "Action introuvable." };

  const query = supabase.from("commercial_actions").update({ action_status: "fait", statut: "fait", updated_at: new Date().toISOString() }).eq("id", actionId).eq("owner_user_id", userId).select("*").maybeSingle();
  const result = await query;

  if (result.error && isMissingOwnerUserColumn(result.error.message ?? "")) {
    const fallbackResult = await supabase.from("commercial_actions").update({ action_status: "fait", statut: "fait", updated_at: new Date().toISOString() }).eq("id", actionId).eq("owner_id", userId).select("*").maybeSingle();
    if (fallbackResult.error) return { ok: false, error: fallbackResult.error.message };
    return { ok: Boolean(fallbackResult.data), error: fallbackResult.data ? "" : "Action introuvable." };
  }

  if (result.error) return { ok: false, error: result.error.message };
  return { ok: Boolean(result.data), error: result.data ? "" : "Action introuvable." };
}

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const supabase = createAdminClient();
    const { stats, context, campaigns } = await generateAutomations(supabase, user.id, "load");

    const prospectById = new Map<string, DbRow>();
    const lastOrderByProspectId = new Map<string, Date>();

    for (const prospect of context.prospects) prospectById.set(asString(readField(prospect, "id")), prospect);
    for (const order of context.orders) {
      const prospectClientId = asString(readField(order, "prospect_client_id", "client_id"));
      if (!prospectClientId) continue;
      const orderDate = parseDate(readField(order, "order_date", "created_at"));
      if (!orderDate) continue;
      const current = lastOrderByProspectId.get(prospectClientId);
      if (!current || current < orderDate) lastOrderByProspectId.set(prospectClientId, orderDate);
    }

    const actions = context.actions
      .map((row) => {
        const prospectClientId = asString(readField(row, "prospect_client_id"));
        const prospect = prospectById.get(prospectClientId);
        const clientName = prospect ? prospectName(prospect) : "-";
        return mapAction(row, clientName, context.templates, prospect, lastOrderByProspectId.get(prospectClientId) ?? null);
      })
      .sort((a, b) => b.actionDate.localeCompare(a.actionDate));

    return NextResponse.json({ ok: true, actions, campaigns, automation: stats });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Chargement actions impossible." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const mode = parseBodyMode(body);
    const supabase = createAdminClient();

    if (mode === "complete") {
      const actionId = asString(body?.actionId);
      const result = await completeAction(supabase, user.id, actionId);
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error || "Mise a jour impossible." }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    const { stats, campaigns } = await generateAutomations(supabase, user.id, "manual");
    return NextResponse.json({ ok: true, automation: stats, campaigns });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Generation automatique impossible." }, { status: 500 });
  }
}
