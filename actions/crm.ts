"use server";

import { revalidatePath } from "next/cache";
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
  prospect_client_id: string;
  action_type: string;
  type: string;
  statut: string;
  date_action: string;
  compte_rendu: string;
  prochaine_action: string | null;
  date_prochaine_action: string | null;
};

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
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
  const actionType = clean(formData.get("actionType")) || "appel";
  const actionStatus = clean(formData.get("actionStatus")) || "a_faire";

  const payload: CommercialActionInsertPayload = {
    owner_user_id: user.id,
    prospect_client_id: prospectClientId,
    action_type: actionType,
    type: actionType,
    statut: actionStatus,
    date_action: actionDate || new Date().toISOString(),
    compte_rendu: summary,
    prochaine_action: clean(formData.get("details")) || null,
    date_prochaine_action: nextActionDate || null
  };

  const { error } = await supabase.from("commercial_actions").insert(payload);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/crm/${prospectClientId}`);
  revalidatePath("/actions");

  return { ok: true, message: "Action commerciale ajoutee." };
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
