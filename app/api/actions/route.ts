import { NextRequest, NextResponse } from "next/server";
import { mapCommercialActionType, type CommercialActionType } from "@/lib/commercial-action-type";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;
type ActionType = CommercialActionType;
type ActionStatus = "a_faire" | "fait" | "annule";
type CandidateCategory = "prospect_followup" | "inactive_client" | "pending_order" | "missing_info";

type AutomationCandidate = {
  key: string;
  category: CandidateCategory;
  prospectClientId: string;
  actionType: string;
  actionDateIso: string;
  summary: string;
  details: string;
  nextActionDateIso?: string;
  nextActionType?: string;
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
  skippedExistingCount: number;
  skippedMissingClientCount: number;
  skippedOptOutCount: number;
  skippedInsertErrorCount: number;
  skippedDuplicateCount: number;
  generatedAt: string;
  reason?: string;
};

type ContextData = {
  prospects: DbRow[];
  legacyClients: DbRow[];
  actions: DbRow[];
  orders: DbRow[];
  quotes: DbRow[];
  devis: DbRow[];
  emailLogs: DbRow[];
  templates: DbRow[];
};

const OPEN_STATUSES = new Set(["a_faire", "todo", "open", "en_cours", "pending", "a_traiter"]);
const COMPLETED_ACTION_STATUSES = new Set(["fait", "annule", "termine", "terminee", "terminé", "completed", "done", "closed", "cancelled", "canceled"]);
const PENDING_STATUSES = new Set(["brouillon", "envoyee", "pending", "draft", "en_attente", "a_valider", "open", "awaiting"]);
const CLOSED_ORDER_STATUSES = new Set(["validee", "livree", "payee", "annulee", "cancelled", "done", "completed", "closed"]);
const RECENT_CONTACT_DAYS = 21;
const INACTIVE_CLIENT_DAYS = 45;
const CLOSE_DATE_WINDOW_DAYS = 3;
const MAX_ACTIONS_PER_RUN = 200;

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

function extractNotNullColumn(message: string) {
  const match = message.match(/null value in column "([^"]+)"/i);
  return match?.[1] ?? null;
}

function extractForeignKeyColumn(message: string) {
  const constraint = message.match(/foreign key constraint "([^"]+)"/i)?.[1] ?? "";
  if (constraint.includes("_client_id_")) return "client_id";
  if (constraint.includes("_prospect_client_id_")) return "prospect_client_id";
  return null;
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeActionStatus(row: DbRow): ActionStatus {
  const raw = normalizeText(readField(row, "action_status", "statut", "status"));
  if (!raw) return "a_faire";
  if (raw === "annule") return "annule";
  if (COMPLETED_ACTION_STATUSES.has(raw)) return "fait";
  return "a_faire";
}

function isOpenAction(row: DbRow) {
  const raw = normalizeText(readField(row, "action_status", "statut", "status"));
  if (!raw) return true;
  if (COMPLETED_ACTION_STATUSES.has(raw)) return false;
  return OPEN_STATUSES.has(raw) || raw === "a_faire";
}

function normalizeActionType(row: DbRow): ActionType {
  return mapCommercialActionType(readField(row, "action_type", "type_action", "type"), "relance");
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

function summaryFingerprint(text: string) {
  return normalizeText(text).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function areSimilarSummaries(a: string, b: string) {
  const left = summaryFingerprint(a);
  const right = summaryFingerprint(b);
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left);
}

function candidateDate(candidate: AutomationCandidate) {
  return parseDate(candidate.nextActionDateIso ?? candidate.actionDateIso);
}

function actionPlannedDate(row: DbRow) {
  return parseDate(readField(row, "next_action_date", "date_prochaine_action", "action_date", "date_action", "created_at"));
}

function isExistingOpenMatch(actions: DbRow[], candidate: AutomationCandidate) {
  const mappedType = mapCommercialActionType(candidate.actionType, "relance");
  const wantedDate = candidateDate(candidate);

  for (const action of actions) {
    const prospectClientId = asString(readField(action, "prospect_client_id"));
    if (prospectClientId !== candidate.prospectClientId) continue;
    if (!isOpenAction(action)) continue;

    const existingType = normalizeActionType(action);
    if (existingType !== mappedType) continue;

    const existingSummary = asString(readField(action, "summary", "compte_rendu"));
    if (!areSimilarSummaries(existingSummary, candidate.summary)) continue;

    const existingDate = actionPlannedDate(action);
    if (!wantedDate || !existingDate) return true;

    const diffDays = Math.abs(existingDate.getTime() - wantedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= CLOSE_DATE_WINDOW_DAYS) return true;
  }

  return false;
}

function isPendingRecord(row: DbRow) {
  const status = normalizeText(readField(row, "order_status", "quote_status", "devis_status", "statut", "status", "state"));
  if (!status) return false;
  if (CLOSED_ORDER_STATUSES.has(status)) return false;
  return PENDING_STATUSES.has(status);
}

function isMissingContactInfo(row: DbRow) {
  const companyName = asString(readField(row, "company_name", "trade_name", "name"));
  const email = getContactEmail(row);
  const phone = asString(readField(row, "phone"));
  const mobile = asString(readField(row, "mobile"));
  return !companyName || !email || (!phone && !mobile);
}

function isEligibleProspect(row: DbRow) {
  const id = asString(readField(row, "id"));
  if (!id) return false;

  const commercialStatus = normalizeText(readField(row, "commercial_status", "status"));
  if (commercialStatus === "inactif" || commercialStatus === "perdu") return false;

  return true;
}

function hasOpenActionForProspect(actions: DbRow[], prospectClientId: string) {
  return actions.some((action) => asString(readField(action, "prospect_client_id")) === prospectClientId && isOpenAction(action));
}

function buildActionInsertPayload(ownerUserId: string, candidate: AutomationCandidate, legacyClientId: string) {
  const actionType = mapCommercialActionType(candidate.actionType, "relance");
  const nextActionType = candidate.nextActionType ? mapCommercialActionType(candidate.nextActionType, "relance") : null;

  return {
    owner_user_id: ownerUserId,
    owner_id: ownerUserId,
    prospect_client_id: candidate.prospectClientId,
    client_id: legacyClientId,
    action_type: actionType,
    type_action: actionType,
    type: actionType,
    action_status: "a_faire",
    statut: "a_faire",
    action_date: candidate.actionDateIso,
    date_action: candidate.actionDateIso,
    summary: candidate.summary,
    compte_rendu: candidate.summary,
    details: `AUTO_KEY:${candidate.key}\n${candidate.details}`,
    prochaine_action: `AUTO_KEY:${candidate.key}\n${candidate.details}`,
    // Future manual step: for "email" actions, trigger Brevo from an explicit user action only.
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

    const message = error.message ?? "Insertion commercial_actions impossible.";
    const missingColumn = extractMissingColumn(message);
    if (missingColumn === "client_id") {
      throw new Error(`MISSING_CLIENT_ID_COLUMN:${message}`);
    }
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }

    const foreignKeyColumn = extractForeignKeyColumn(message);
    if (foreignKeyColumn === "client_id") {
      throw new Error(`FK:client_id:${message}`);
    }
    if (foreignKeyColumn && Object.prototype.hasOwnProperty.call(workingPayload, foreignKeyColumn)) {
      delete workingPayload[foreignKeyColumn];
      continue;
    }

    const notNullColumn = extractNotNullColumn(message);
    if (notNullColumn) {
      throw new Error(`NOT_NULL:${notNullColumn}:${message}`);
    }

    throw new Error(message);
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

async function fetchOwnedRowsOptional(supabase: ReturnType<typeof createAdminClient>, table: string, userId: string, orderByColumn?: string) {
  const result = await fetchOwnedRows(supabase, table, userId, orderByColumn);
  const message = result.error?.message ?? "";
  const lower = message.toLowerCase();
  if (
    (lower.includes("relation") && lower.includes("does not exist")) ||
    (lower.includes("column") && (lower.includes("owner_user_id") || lower.includes("owner_id")))
  ) {
    return { data: [] as unknown[], error: null as null };
  }
  return result;
}

async function loadContext(supabase: ReturnType<typeof createAdminClient>, userId: string): Promise<ContextData> {
  const [prospectsResult, legacyClientsResult, actionsResult, ordersResult, quotesResult, devisResult, emailLogsResult, templatesResult] = await Promise.all([
    fetchOwnedRows(supabase, "prospects_clients", userId, "updated_at"),
    fetchOwnedRowsOptional(supabase, "clients", userId, "updated_at"),
    fetchOwnedRows(supabase, "commercial_actions", userId, "created_at"),
    fetchOwnedRowsOptional(supabase, "orders", userId, "created_at"),
    fetchOwnedRowsOptional(supabase, "quotes", userId, "created_at"),
    fetchOwnedRowsOptional(supabase, "devis", userId, "created_at"),
    fetchOwnedRowsOptional(supabase, "email_logs", userId, "created_at"),
    supabase.from("email_templates").select("*").eq("is_active", true)
  ]);

  const firstError = prospectsResult.error ?? legacyClientsResult.error ?? actionsResult.error ?? ordersResult.error ?? quotesResult.error ?? devisResult.error ?? emailLogsResult.error ?? templatesResult.error;
  if (firstError) throw new Error(firstError.message);

  return {
    prospects: (prospectsResult.data ?? []) as DbRow[],
    legacyClients: (legacyClientsResult.data ?? []) as DbRow[],
    actions: (actionsResult.data ?? []) as DbRow[],
    orders: (ordersResult.data ?? []) as DbRow[],
    quotes: (quotesResult.data ?? []) as DbRow[],
    devis: (devisResult.data ?? []) as DbRow[],
    emailLogs: (emailLogsResult.data ?? []) as DbRow[],
    templates: (templatesResult.data ?? []) as DbRow[]
  };
}

function resolveLegacyClientId(prospect: DbRow, legacyClients: DbRow[]) {
  const prospectId = asString(readField(prospect, "id"));
  if (!prospectId || !legacyClients.length) return null;

  const direct = legacyClients.find((row) => asString(readField(row, "id")) === prospectId);
  if (direct) return asString(readField(direct, "id"));

  const mapped = legacyClients.find((row) => {
    const linkedId = asString(readField(row, "prospect_client_id", "prospect_id", "prospectId", "crm_prospect_id"));
    return linkedId && linkedId === prospectId;
  });
  if (mapped) return asString(readField(mapped, "id"));

  const prospectEmail = normalizeText(readField(prospect, "email", "contact_email", "mail"));
  if (prospectEmail) {
    const byEmail = legacyClients.find((row) => normalizeText(readField(row, "email", "contact_email", "mail")) === prospectEmail);
    if (byEmail) return asString(readField(byEmail, "id"));
  }

  const candidateNames = [
    normalizeText(readField(prospect, "trade_name")),
    normalizeText(readField(prospect, "company_name")),
    normalizeText(readField(prospect, "name"))
  ].filter(Boolean);

  if (candidateNames.length) {
    const byName = legacyClients.find((row) => {
      const names = [
        normalizeText(readField(row, "trade_name")),
        normalizeText(readField(row, "company_name")),
        normalizeText(readField(row, "raison_sociale")),
        normalizeText(readField(row, "nom_societe")),
        normalizeText(readField(row, "societe")),
        normalizeText(readField(row, "name"))
      ].filter(Boolean);
      return names.some((name) => candidateNames.includes(name));
    });
    if (byName) return asString(readField(byName, "id"));
  }

  return null;
}

function _isInsertCompatibilityError(message: string) {
  return (
    message.startsWith("NOT_NULL:client_id:") ||
    message.startsWith("FK:client_id:") ||
    message.startsWith("MISSING_CLIENT_ID_COLUMN:") ||
    message.toLowerCase().includes("violates not-null constraint") ||
    message.toLowerCase().includes("violates foreign key constraint")
  );
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

function buildCampaignsFromCandidates(candidates: AutomationCandidate[]) {
  const counts = {
    prospect_followup: candidates.filter((item) => item.category === "prospect_followup").length,
    inactive_client: candidates.filter((item) => item.category === "inactive_client").length,
    pending_order: candidates.filter((item) => item.category === "pending_order").length,
    missing_info: candidates.filter((item) => item.category === "missing_info").length
  };

  return [
    campaignTemplate("Prospects sans contact recent", counts.prospect_followup, "Relance prospect", "Premier contact ou suivi commercial a realiser."),
    campaignTemplate("Clients inactifs", counts.inactive_client, "Relance client inactif", "Reprise de contact et qualification des besoins."),
    campaignTemplate("Commandes ou devis en attente", counts.pending_order, "Relance en attente", "Suivi des commandes/devis en attente sans envoi automatique."),
    campaignTemplate("Infos client a completer", counts.missing_info, "Completer la fiche", "Completer les informations avant la prochaine action.")
  ];
}

function collectLastDates(rows: DbRow[], keys: string[]) {
  const byProspect = new Map<string, Date>();

  for (const row of rows) {
    const prospectId = asString(readField(row, "prospect_client_id", "client_id", "prospect_id"));
    if (!prospectId) continue;

    const date = parseDate(readField(row, ...keys));
    if (!date) continue;

    const current = byProspect.get(prospectId);
    if (!current || current < date) byProspect.set(prospectId, date);
  }

  return byProspect;
}

function createCandidateFactory(context: ContextData) {
  const candidates = new Map<string, AutomationCandidate>();
  const stats = { skippedExistingCount: 0, skippedOptOutCount: 0 };

  const addCandidate = (candidate: AutomationCandidate, isOptOutContact: boolean) => {
    if (isOptOutContact) {
      stats.skippedOptOutCount += 1;
      return;
    }

    const dedupeKey = `${candidate.prospectClientId}:${mapCommercialActionType(candidate.actionType, "relance")}:${summaryFingerprint(candidate.summary)}:${(candidate.nextActionDateIso ?? candidate.actionDateIso).slice(0, 10)}`;
    if (candidates.has(dedupeKey) || isExistingOpenMatch(context.actions, candidate)) {
      stats.skippedExistingCount += 1;
      return;
    }

    candidates.set(dedupeKey, candidate);
  };

  return { addCandidate, candidates, stats };
}

function _buildAutomationCandidates(context: ContextData, now: Date) {
  const { addCandidate, candidates, stats } = createCandidateFactory(context);

  const lastActionByProspect = collectLastDates(context.actions, ["action_date", "date_action", "created_at"]);
  const lastOrderByProspect = collectLastDates(context.orders, ["order_date", "created_at"]);
  const lastEmailByProspect = collectLastDates(context.emailLogs, ["sent_at", "created_at"]);

  const prospectsById = new Map<string, DbRow>();
  for (const prospect of context.prospects) {
    prospectsById.set(asString(readField(prospect, "id")), prospect);
  }

  for (const prospect of context.prospects) {
    const prospectClientId = asString(readField(prospect, "id"));
    if (!prospectClientId) continue;

    const name = prospectName(prospect);
    const optOut = isOptOut(prospect);
    const recordType = normalizeText(readField(prospect, "record_type", "type"));

    const lastAction = lastActionByProspect.get(prospectClientId) ?? null;
    const lastEmail = lastEmailByProspect.get(prospectClientId) ?? null;
    const lastOrder = lastOrderByProspect.get(prospectClientId) ?? null;

    const lastInteraction = [lastAction, lastEmail, lastOrder]
      .filter((item): item is Date => Boolean(item))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    const daysSinceInteraction = lastInteraction ? Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)) : Number.POSITIVE_INFINITY;
    const daysSinceOrder = lastOrder ? Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)) : Number.POSITIVE_INFINITY;

    if (recordType === "prospect" && daysSinceInteraction > RECENT_CONTACT_DAYS) {
      const actionDate = Number.isFinite(daysSinceInteraction) ? now : addDays(now, 1);
      addCandidate(
        {
          key: `auto:prospect:${prospectClientId}`,
          category: "prospect_followup",
          prospectClientId,
          actionType: "appel",
          actionDateIso: actionDate.toISOString(),
          nextActionDateIso: actionDate.toISOString(),
          summary: "Relancer le prospect - premier contact ou suivi commercial",
          details: `Prospect cible: ${name}.`
        },
        optOut
      );
    }

    if (recordType === "client" && daysSinceOrder >= INACTIVE_CLIENT_DAYS) {
      const actionDate = addDays(now, 2);
      addCandidate(
        {
          key: `auto:inactive:${prospectClientId}`,
          category: "inactive_client",
          prospectClientId,
          actionType: "relance",
          actionDateIso: actionDate.toISOString(),
          nextActionDateIso: actionDate.toISOString(),
          summary: "Relance client inactif - reprendre contact et identifier les besoins",
          details: `Client cible: ${name}. Derniere commande: ${lastOrder ? lastOrder.toISOString().slice(0, 10) : "aucune"}.`
        },
        optOut
      );
    }

    if (isMissingContactInfo(prospect)) {
      const actionDate = addDays(now, 7);
      addCandidate(
        {
          key: `auto:missing-info:${prospectClientId}`,
          category: "missing_info",
          prospectClientId,
          actionType: "note",
          actionDateIso: actionDate.toISOString(),
          nextActionDateIso: actionDate.toISOString(),
          summary: "Completer les informations client avant prochaine action",
          details: `Verifier email/telephone/societe pour ${name}.`
        },
        false
      );
    }
  }

  const pendingSources = [...context.orders, ...context.quotes, ...context.devis];
  for (const row of pendingSources) {
    if (!isPendingRecord(row)) continue;

    const prospectClientId = asString(readField(row, "prospect_client_id", "client_id", "prospect_id"));
    if (!prospectClientId) continue;

    const prospect = prospectsById.get(prospectClientId);
    const reference = asString(readField(row, "order_number", "quote_number", "devis_number", "reference", "number", "id"));

    addCandidate(
      {
        key: `auto:pending:${prospectClientId}:${reference || "record"}`,
        category: "pending_order",
        prospectClientId,
        actionType: "email",
        actionDateIso: now.toISOString(),
        nextActionDateIso: now.toISOString(),
        summary: "Relancer le devis ou la commande en attente",
        details: `Element en attente: ${reference || "sans reference"}. Aucun envoi Brevo automatique.`
      },
      prospect ? isOptOut(prospect) : false
    );
  }

  return {
    candidates: Array.from(candidates.values()).sort((a, b) => a.actionDateIso.localeCompare(b.actionDateIso)),
    skippedExistingCount: stats.skippedExistingCount,
    skippedOptOutCount: stats.skippedOptOutCount
  };
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
  const { templateCode, templateId } = pickTemplate(templates, ["send_order", "send_sales_pack", "send_account_opening"]);
  const lastOrderLabel = lastOrderDate ? lastOrderDate.toISOString().slice(0, 10) : "pas de commande recente";

  // Future hook: this payload is prepared for manual Brevo sending from the UI, never auto-sent here.
  const subject = actionType === "email" ? `Relance email manuelle - ${name}` : `Suivi commercial ${clientType} - ${name}`;
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

async function generateAutomations(supabase: ReturnType<typeof createAdminClient>, userId: string): Promise<{ stats: AutomationStats; context: ContextData; campaigns: AutomationCampaign[] }> {
  const now = new Date();
  let context: ContextData;
  try {
    context = await loadContext(supabase, userId);
  } catch (error) {
    console.error("AUTO ACTIONS ERROR:", error);
    return {
      stats: {
        createdCount: 0,
        skippedExistingCount: 0,
        skippedMissingClientCount: 0,
        skippedOptOutCount: 0,
        skippedInsertErrorCount: 0,
        skippedDuplicateCount: 0,
        generatedAt: now.toISOString(),
        reason: "Aucun client trouve"
      },
      context: {
        prospects: [],
        legacyClients: [],
        actions: [],
        orders: [],
        quotes: [],
        devis: [],
        emailLogs: [],
        templates: []
      },
      campaigns: []
    };
  }

  const clients = context.prospects.filter(isEligibleProspect).slice(0, MAX_ACTIONS_PER_RUN);
  console.log("AUTO ACTIONS - clients trouvés:", clients.length);

  let createdCount = 0;
  let skippedCount = 0;
  let skippedExistingCount = 0;
  let skippedMissingClientCount = 0;
  let skippedInsertErrorCount = 0;

  for (const client of clients) {
    const prospectClientId = asString(readField(client, "id"));
    if (!prospectClientId) {
      skippedCount += 1;
      skippedMissingClientCount += 1;
      continue;
    }

    if (hasOpenActionForProspect(context.actions, prospectClientId)) {
      skippedCount += 1;
      skippedExistingCount += 1;
      continue;
    }

    const legacyClientId = resolveLegacyClientId(client, context.legacyClients);
    if (context.legacyClients.length > 0 && !legacyClientId) {
      skippedCount += 1;
      skippedMissingClientCount += 1;
      continue;
    }

    const nextDate = addDays(now, 2).toISOString();
    const payload = buildActionInsertPayload(userId, {
      key: `auto:relance:${prospectClientId}`,
      category: "inactive_client",
      prospectClientId,
      actionType: "relance",
      actionDateIso: now.toISOString(),
      nextActionDateIso: nextDate,
      summary: "Relance automatique - reprendre contact avec le client",
      details: "Action generee automatiquement."
    }, legacyClientId ?? prospectClientId);

    try {
      await insertCommercialActionCompat(supabase, payload);
      createdCount += 1;
      context.actions.push({
        prospect_client_id: prospectClientId,
        action_type: "relance",
        action_status: "a_faire",
        summary: "Relance automatique - reprendre contact avec le client",
        next_action_date: nextDate,
        action_date: now.toISOString()
      });
    } catch (error) {
      console.error("AUTO ACTIONS ERROR:", error);
      const message = error instanceof Error ? error.message : "Insertion commercial_actions impossible.";
      console.error("CLIENT SKIPPED:", prospectClientId, message);
      skippedCount += 1;
      skippedInsertErrorCount += 1;
    }
  }

  console.log("AUTO ACTIONS - actions créées:", createdCount);
  console.log("AUTO ACTIONS - clients ignorés:", skippedCount);

  const refreshedContext = createdCount > 0 ? await loadContext(supabase, userId) : context;
  const campaigns = buildCampaignsFromCandidates([]);

  let reason = "";
  if (createdCount === 0) {
    if (!clients.length) reason = "Aucun client trouve";
    else if (skippedExistingCount === clients.length) reason = "Toutes les actions existent deja";
    else reason = "Aucun client eligible";
  }

  return {
    stats: {
      createdCount,
      skippedExistingCount,
      skippedMissingClientCount,
      skippedOptOutCount: 0,
      skippedInsertErrorCount,
      skippedDuplicateCount: skippedExistingCount,
      generatedAt: now.toISOString(),
      reason
    },
    context: refreshedContext,
    campaigns
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

async function loadActionsForPage(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  let query = supabase.from("commercial_actions").select("*").eq("owner_user_id", userId).limit(20);
  let result = await query;

  console.log("SUPABASE DATA:", result.data);
  console.log("SUPABASE ERROR:", result.error);
  if (result.error) {
    console.error("SUPABASE FULL ERROR:", result.error);
  }

  if (result.error && isMissingOwnerUserColumn(result.error.message ?? "")) {
    query = supabase.from("commercial_actions").select("*").eq("owner_id", userId).limit(20);
    result = await query;
    console.log("SUPABASE DATA:", result.data);
    console.log("SUPABASE ERROR:", result.error);
    if (result.error) {
      console.error("SUPABASE FULL ERROR:", result.error);
    }
  }

  if (result.error) {
    const lower = (result.error.message ?? "").toLowerCase();
    if (lower.includes("column") && lower.includes("owner_id")) {
      // Last-resort debug fallback to validate the table itself, without owner column filters.
      result = await supabase.from("commercial_actions").select("*").limit(20);
      console.log("SUPABASE DATA:", result.data);
      console.log("SUPABASE ERROR:", result.error);
      if (result.error) {
        console.error("SUPABASE FULL ERROR:", result.error);
      }
    }
  }

  if (result.error) {
    throw new Error(result.error.message ?? "Chargement actions impossible.");
  }

  return (result.data ?? []) as DbRow[];
}

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const supabase = createAdminClient();
    const now = new Date();
    const rawActions = await loadActionsForPage(supabase, user.id);

    const prospectsResult = await fetchOwnedRowsOptional(supabase, "prospects_clients", user.id, "updated_at");
    const templatesResult = await fetchOwnedRowsOptional(supabase, "email_templates", user.id);
    const ordersResult = await fetchOwnedRowsOptional(supabase, "orders", user.id, "created_at");

    const prospects = (prospectsResult.data ?? []) as DbRow[];
    const templates = (templatesResult.data ?? []) as DbRow[];
    const orders = (ordersResult.data ?? []) as DbRow[];

    const prospectById = new Map<string, DbRow>();
    const lastOrderByProspectId = new Map<string, Date>();

    for (const prospect of prospects) prospectById.set(asString(readField(prospect, "id")), prospect);
    for (const order of orders) {
      const prospectClientId = asString(readField(order, "prospect_client_id", "client_id"));
      if (!prospectClientId) continue;
      const orderDate = parseDate(readField(order, "order_date", "created_at"));
      if (!orderDate) continue;
      const current = lastOrderByProspectId.get(prospectClientId);
      if (!current || current < orderDate) lastOrderByProspectId.set(prospectClientId, orderDate);
    }

    const actions = rawActions
      .map((row) => {
        const prospectClientId = asString(readField(row, "prospect_client_id"));
        const prospect = prospectById.get(prospectClientId);
        const clientName = prospect ? prospectName(prospect) : "-";
        return mapAction(row, clientName, templates, prospect, lastOrderByProspectId.get(prospectClientId) ?? null);
      })
      .sort((a, b) => b.actionDate.localeCompare(a.actionDate));

    return NextResponse.json({
      ok: true,
      actions,
      campaigns: [],
      automation: {
        createdCount: 0,
        skippedExistingCount: 0,
        skippedMissingClientCount: 0,
        skippedOptOutCount: 0,
        skippedInsertErrorCount: 0,
        skippedDuplicateCount: 0,
        generatedAt: now.toISOString()
      } satisfies AutomationStats
    });
  } catch (error) {
    console.error("ACTIONS_GET_ERROR", error);
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

    const { stats, campaigns } = await generateAutomations(supabase, user.id);
    return NextResponse.json({ ok: true, automation: stats, campaigns });
  } catch (error) {
    console.error("AUTO ACTIONS ERROR:", error);
    return NextResponse.json({
      ok: true,
      automation: {
        createdCount: 0,
        skippedExistingCount: 0,
        skippedMissingClientCount: 0,
        skippedOptOutCount: 0,
        skippedInsertErrorCount: 1,
        skippedDuplicateCount: 0,
        generatedAt: new Date().toISOString(),
        reason: "Aucun client eligible"
      } satisfies AutomationStats,
      campaigns: []
    });
  }
}
