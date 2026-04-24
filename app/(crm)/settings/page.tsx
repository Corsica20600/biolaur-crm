import { PageHeader } from "@/components/page-header";
import { defaultAppSettings } from "@/lib/default-settings";
import { SettingsForm, type SettingsSaveState } from "@/components/settings/settings-form";
import { createClient } from "@/supabase/server";
import type { AppSettings } from "@/types/crm";

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function unknownColumnName(message?: string) {
  if (!message) return null;

  return (
    message.match(/Could not find the '([^']+)' column/)?.[1] ??
    message.match(/column "([^"]+)" does not exist/)?.[1] ??
    message.match(/'([^']+)' column of 'app_settings'/)?.[1] ??
    null
  );
}

type SettingsRow = Record<string, unknown>;

function mapSettings(row: SettingsRow): AppSettings {
  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? row.owner_id ?? ""),
    companyName: String(row.company_name ?? ""),
    senderName: String(row.sender_name ?? ""),
    senderEmail: String(row.sender_email ?? ""),
    senderPhone: String(row.sender_phone ?? ""),
    companyAddress: String(row.company_address ?? ""),
    logoUrl: String(row.logo_url ?? ""),
    defaultCommissionRate: Number(row.default_commission_rate ?? 20),
    defaultVatRate: Number(row.default_vat_rate ?? 20),
    clientCategories: String(row.client_categories ?? "CHR, collectivite, commerce de bouche, autre"),
    productCategories: String(row.product_categories ?? "Entretien, Vaisselle, Sanitaires, Technique, Ouate"),
    currency: String(row.currency ?? "EUR"),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

async function loadUserSettings(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const byOwnerUserId = await supabase.from("app_settings").select("*").eq("owner_user_id", userId).maybeSingle();

  if (!byOwnerUserId.error) {
    return byOwnerUserId;
  }

  const missingOwnerUserId = unknownColumnName(byOwnerUserId.error.message) === "owner_user_id";
  if (!missingOwnerUserId) {
    return byOwnerUserId;
  }

  return supabase.from("app_settings").select("*").eq("owner_id", userId).maybeSingle();
}

async function persistSettings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  existing: { id: string } | null,
  payload: Record<string, string | number | null>
) {
  const nextPayload = { ...payload };
  const removedColumns = new Set<string>();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = existing
      ? await supabase.from("app_settings").update(nextPayload).eq("id", existing.id)
      : await supabase.from("app_settings").insert(nextPayload);

    if (!result.error) {
      return { error: null, removedColumns };
    }

    const missingColumn = unknownColumnName(result.error.message);
    if (!missingColumn || !(missingColumn in nextPayload)) {
      return { error: result.error, removedColumns };
    }

    delete nextPayload[missingColumn];
    removedColumns.add(missingColumn);
  }

  return { error: new Error("Trop de colonnes app_settings incompatibles.") as Error, removedColumns };
}

async function saveSettings(_previousState: SettingsSaveState, formData: FormData): Promise<SettingsSaveState> {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Connexion requise pour enregistrer les parametres." };
  }

  const payload = {
    owner_user_id: user.id,
    owner_id: user.id,
    company_name: String(formData.get("companyName") ?? "").trim(),
    sender_name: String(formData.get("senderName") ?? "").trim() || "Commercial Biolaur",
    sender_email: String(formData.get("senderEmail") ?? "").trim(),
    sender_phone: String(formData.get("senderPhone") ?? "").trim(),
    company_address: String(formData.get("companyAddress") ?? "").trim(),
    logo_url: String(formData.get("logoUrl") ?? "").trim() || null,
    default_commission_rate: parseNumber(formData.get("defaultCommissionRate"), 20),
    default_vat_rate: parseNumber(formData.get("defaultVatRate"), 20),
    client_categories: String(formData.get("clientCategories") ?? "").trim(),
    product_categories: String(formData.get("productCategories") ?? "").trim(),
    currency: String(formData.get("currency") ?? "EUR").trim() || "EUR"
  };

  if (!payload.company_name || !payload.sender_email) {
    return { ok: false, message: "La societe et l'email expediteur sont obligatoires." };
  }

  const { data: existing, error: loadError } = await loadUserSettings(supabase, user.id);

  if (loadError) {
    return { ok: false, message: `Lecture des parametres impossible : ${loadError.message}` };
  }

  const { error: saveError, removedColumns } = await persistSettings(supabase, existing ? { id: existing.id } : null, payload);

  if (saveError) {
    return {
      ok: false,
      message: `Enregistrement impossible : ${saveError.message}`
    };
  }

  return {
    ok: true,
    message: removedColumns.size
      ? `Parametres enregistres. Champs non supportes ignores : ${Array.from(removedColumns).join(", ")}.`
      : "Parametres enregistres."
  };
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data } = user ? await loadUserSettings(supabase, user.id) : { data: null };

  const settings = data ? mapSettings(data) : defaultAppSettings;

  return (
    <>
      <PageHeader title="Parametres" description="Societe, email expediteur, commissions, TVA et categories." />
      <SettingsForm settings={settings} saveSettings={saveSettings} />
    </>
  );
}
