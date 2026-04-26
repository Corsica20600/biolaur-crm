"use server";

import { revalidatePath } from "next/cache";
import { mapCommercialActionType, type CommercialActionType } from "@/lib/commercial-action-type";
import { createClient } from "@/supabase/server";

export type SaveProspectClientState = {
  ok: boolean;
  message: string;
  recordId?: string;
};

export type CreateCommercialActionState = {
  ok: boolean;
  message: string;
};

type CommercialActionInsertPayload = {
  owner_user_id: string;
  owner_id: string;
  prospect_client_id: string;
  client_id: string | null;
  action_type: CommercialActionType;
  type_action: CommercialActionType;
  type: CommercialActionType;
  action_status: string;
  statut: string;
  action_date: string;
  date_action: string;
  summary: string;
  compte_rendu: string;
  details: string | null;
  prochaine_action: string | null;
  date_prochaine_action: string | null;
};

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function extractMissingColumn(message: string) {
  const fromPostgrest = message.match(/Could not find the '([^']+)' column/i)?.[1];
  if (fromPostgrest) return fromPostgrest;
  const fromPostgres = message.match(/column "([^"]+)" of relation/i)?.[1] ?? message.match(/column "([^"]+)" does not exist/i)?.[1];
  return fromPostgres ?? null;
}

function extractForeignKeyColumn(message: string) {
  const constraint = message.match(/foreign key constraint "([^"]+)"/i)?.[1] ?? "";
  if (constraint.includes("_client_id_")) return "client_id";
  if (constraint.includes("_prospect_client_id_")) return "prospect_client_id";
  return null;
}

function extractNotNullColumn(message: string) {
  const match = message.match(/null value in column "([^"]+)"/i);
  return match?.[1] ?? null;
}

function isMissingOwnerUserColumn(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("owner_user_id") && (lower.includes("column") || lower.includes("could not find"));
}

function readField(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined) return value;
  }
  return undefined;
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function resolveLegacyClientId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerUserId: string,
  prospectClientId: string
) {
  const { data: orderRows, error: ordersError } = await supabase
    .from("orders")
    .select("client_id,prospect_client_id,created_at")
    .eq("owner_user_id", ownerUserId)
    .eq("prospect_client_id", prospectClientId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!ordersError) {
    const withClient = (orderRows ?? []).find((row) => String((row as Record<string, unknown>).client_id ?? "").length > 0);
    if (withClient) return String((withClient as Record<string, unknown>).client_id ?? "");
  }

  const { data: prospectRow, error: prospectError } = await supabase
    .from("prospects_clients")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .eq("id", prospectClientId)
    .maybeSingle();

  if (prospectError || !prospectRow) return null;

  const prospect = prospectRow as Record<string, unknown>;
  const prospectEmail = normalizeText(readField(prospect, "email", "contact_email", "mail"));
  const prospectNames = [
    normalizeText(readField(prospect, "trade_name")),
    normalizeText(readField(prospect, "company_name")),
    normalizeText(readField(prospect, "name"))
  ].filter(Boolean);

  const { data: clients, error: clientsError } = await supabase.from("clients").select("*").eq("owner_user_id", ownerUserId).limit(500);
  if (clientsError) return null;

  const rows = (clients ?? []) as Record<string, unknown>[];
  const direct = rows.find((row) => String(readField(row, "id") ?? "") === prospectClientId);
  if (direct) return String(readField(direct, "id") ?? "");

  const linked = rows.find((row) => {
    const linkedId = String(readField(row, "prospect_client_id", "prospect_id", "prospectId", "crm_prospect_id") ?? "");
    return linkedId && linkedId === prospectClientId;
  });
  if (linked) return String(readField(linked, "id") ?? "");

  if (prospectEmail) {
    const byEmail = rows.find((row) => normalizeText(readField(row, "email", "contact_email", "mail")) === prospectEmail);
    if (byEmail) return String(readField(byEmail, "id") ?? "");
  }

  if (prospectNames.length) {
    const byName = rows.find((row) => {
      const names = [
        normalizeText(readField(row, "trade_name")),
        normalizeText(readField(row, "company_name")),
        normalizeText(readField(row, "raison_sociale")),
        normalizeText(readField(row, "nom_societe")),
        normalizeText(readField(row, "societe")),
        normalizeText(readField(row, "name"))
      ].filter(Boolean);
      return names.some((name) => prospectNames.includes(name));
    });
    if (byName) return String(readField(byName, "id") ?? "");
  }

  const displayName =
    String(readField(prospect, "trade_name") ?? "").trim() ||
    String(readField(prospect, "company_name") ?? "").trim() ||
    "Client";
  const email = String(readField(prospect, "email", "contact_email", "mail") ?? "").trim() || null;

  const insertPayload: Record<string, unknown> = {
    owner_user_id: ownerUserId,
    owner_id: ownerUserId,
    prospect_client_id: prospectClientId,
    type_fiche: "client",
    record_type: "client",
    company_name: displayName,
    trade_name: displayName,
    raison_sociale: displayName,
    nom_societe: displayName,
    societe: displayName,
    name: displayName,
    email
  };

  const workingPayload = { ...insertPayload };
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: inserted, error: insertError } = await supabase.from("clients").insert(workingPayload).select("*").single();
    if (!insertError && inserted) {
      const insertedId = String(readField(inserted as Record<string, unknown>, "id") ?? "");
      return insertedId || null;
    }

    const message = insertError?.message ?? "Insertion client legacy impossible.";
    const missingColumn = extractMissingColumn(message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }

    const notNullColumn = extractNotNullColumn(message);
    if (notNullColumn) {
      if (notNullColumn === "owner_user_id") {
        workingPayload.owner_user_id = ownerUserId;
        continue;
      }
      if (notNullColumn === "owner_id") {
        workingPayload.owner_id = ownerUserId;
        continue;
      }
      if (notNullColumn === "type_fiche") {
        workingPayload.type_fiche = "client";
        continue;
      }
      if (["company_name", "trade_name", "raison_sociale", "nom_societe", "societe", "name"].includes(notNullColumn)) {
        workingPayload[notNullColumn] = displayName;
        continue;
      }
    }

    return null;
  }

  return null;
}

export async function saveProspectClient(
  _previousState: SaveProspectClientState,
  formData: FormData
): Promise<SaveProspectClientState> {
  const id = clean(formData.get("id"));
  const recordType = clean(formData.get("recordType")) === "client" ? "client" : "prospect";
  const companyName = clean(formData.get("companyName"));

  if (!companyName) {
    return { ok: false, message: "La raison sociale est obligatoire." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Authentification requise." };
  }

  const payload = {
    owner_user_id: user.id,
    record_type: recordType,
    company_name: companyName,
    trade_name: clean(formData.get("tradeName")) || companyName,
    client_type: clean(formData.get("clientType")) || "CHR",
    commercial_status: clean(formData.get("commercialStatus")) || "a_prospecter",
    siret: clean(formData.get("siret")) || null,
    vat_number: clean(formData.get("vatNumber")) || null,
    contact_first_name: clean(formData.get("contactFirstName")) || null,
    contact_last_name: clean(formData.get("contactLastName")) || null,
    contact_job_title: clean(formData.get("contactJobTitle")) || null,
    phone: clean(formData.get("phone")) || null,
    mobile: clean(formData.get("mobile")) || null,
    email: clean(formData.get("email")) || null,
    address_line_1: clean(formData.get("addressLine1")) || null,
    address_line_2: clean(formData.get("addressLine2")) || null,
    postal_code: clean(formData.get("postalCode")) || null,
    city: clean(formData.get("city")) || null,
    geographic_sector: clean(formData.get("geographicSector")) || null,
    notes: clean(formData.get("notes")) || null,
    source: clean(formData.get("source")) || null
  };

  const query = id
    ? supabase.from("prospects_clients").update(payload).eq("id", id).eq("owner_user_id", user.id).select("id").single()
    : supabase.from("prospects_clients").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error || !data) {
    return { ok: false, message: error?.message ?? "Enregistrement de la fiche impossible." };
  }

  const recordId = String(data.id);
  revalidatePath("/crm");
  revalidatePath(`/crm/${recordId}`);

  return {
    ok: true,
    message: id ? "Fiche mise a jour." : "Fiche creee.",
    recordId
  };
}

export async function createCommercialAction(
  _previousState: CreateCommercialActionState,
  formData: FormData
): Promise<CreateCommercialActionState> {
  const prospectClientId = clean(formData.get("prospectClientId"));
  const summary = clean(formData.get("summary"));

  if (!prospectClientId) {
    return { ok: false, message: "Fiche CRM manquante." };
  }
  if (!summary) {
    return { ok: false, message: "Le resume de l'action est obligatoire." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Authentification requise." };
  }

  const actionDate = clean(formData.get("actionDate"));
  const nextActionDate = clean(formData.get("nextActionDate"));
  const normalizedActionType = mapCommercialActionType(clean(formData.get("actionType")), "relance");
  const actionStatus = clean(formData.get("actionStatus")) || "a_faire";
  const legacyClientId = await resolveLegacyClientId(supabase, user.id, prospectClientId);

  const payload: CommercialActionInsertPayload = {
    owner_user_id: user.id,
    owner_id: user.id,
    prospect_client_id: prospectClientId,
    client_id: legacyClientId,
    action_type: normalizedActionType,
    type_action: normalizedActionType,
    type: normalizedActionType,
    action_status: actionStatus,
    statut: actionStatus,
    action_date: actionDate || new Date().toISOString(),
    date_action: actionDate || new Date().toISOString(),
    summary,
    compte_rendu: summary,
    details: clean(formData.get("details")) || null,
    prochaine_action: clean(formData.get("details")) || null,
    date_prochaine_action: nextActionDate || null
  };

  const workingPayload: Record<string, unknown> = { ...payload };
  let insertError = "";
  let inserted = false;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const { error } = await supabase.from("commercial_actions").insert(workingPayload);
    if (!error) {
      inserted = true;
      break;
    }

    insertError = error.message ?? "Insertion commercial_actions impossible.";
    const missingColumn = extractMissingColumn(insertError);
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }

    const foreignKeyColumn = extractForeignKeyColumn(insertError);
    if (foreignKeyColumn && Object.prototype.hasOwnProperty.call(workingPayload, foreignKeyColumn)) {
      delete workingPayload[foreignKeyColumn];
      continue;
    }

    break;
  }

  if (!inserted) {
    const isClientConstraint =
      insertError.toLowerCase().includes("commercial_actions") &&
      insertError.toLowerCase().includes("client_id") &&
      (insertError.toLowerCase().includes("not-null") || insertError.toLowerCase().includes("foreign key"));
    return {
      ok: false,
      message: isClientConstraint
        ? "Impossible d'ajouter l'action: client legacy non lie a cette fiche. Liaison client requise."
        : insertError || "Insertion commercial_actions impossible."
    };
  }

  revalidatePath(`/crm/${prospectClientId}`);
  revalidatePath("/actions");

  return { ok: true, message: "Action commerciale ajoutee." };
}

export async function setCommercialActionStatus(formData: FormData): Promise<void> {
  const actionId = clean(formData.get("actionId"));
  const prospectClientId = clean(formData.get("prospectClientId"));
  const nextStatusRaw = clean(formData.get("status"));
  const nextStatus = nextStatusRaw === "fait" || nextStatusRaw === "annule" ? nextStatusRaw : "a_faire";

  if (!actionId || !prospectClientId) return;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) return;

  const payload: Record<string, unknown> = {
    action_status: nextStatus,
    statut: nextStatus,
    updated_at: new Date().toISOString()
  };

  const primary = await supabase
    .from("commercial_actions")
    .update(payload)
    .eq("id", actionId)
    .eq("owner_user_id", user.id)
    .select("id");

  const primaryUpdatedCount = Array.isArray(primary.data) ? primary.data.length : 0;
  const shouldFallbackToOwnerId =
    !primary.error && primaryUpdatedCount === 0
      ? true
      : Boolean(primary.error && isMissingOwnerUserColumn(primary.error.message ?? ""));

  if (shouldFallbackToOwnerId) {
    await supabase.from("commercial_actions").update(payload).eq("id", actionId).eq("owner_id", user.id);
  }

  revalidatePath(`/crm/${prospectClientId}`);
  revalidatePath("/actions");
}

export async function convertProspectToClient(formData: FormData): Promise<void> {
  const prospectClientId = clean(formData.get("prospectClientId"));
  if (!prospectClientId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return;
  }

  const { error } = await supabase
    .from("prospects_clients")
    .update({
      record_type: "client",
      commercial_status: "actif",
      updated_at: new Date().toISOString()
    })
    .eq("id", prospectClientId)
    .eq("owner_user_id", user.id);

  if (error) return;

  revalidatePath("/crm");
  revalidatePath(`/crm/${prospectClientId}`);

}
