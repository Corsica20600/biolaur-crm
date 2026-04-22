import { PageHeader } from "@/components/page-header";
import { appSettings } from "@/lib/demo-data";
import { SettingsForm, type SettingsSaveState } from "@/components/settings/settings-form";
import { createClient } from "@/supabase/server";
import type { AppSettings } from "@/types/crm";

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapSettings(row: any): AppSettings {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? row.owner_id,
    companyName: row.company_name ?? "",
    senderName: row.sender_name ?? "",
    senderEmail: row.sender_email ?? "",
    senderPhone: row.sender_phone ?? "",
    companyAddress: row.company_address ?? "",
    logoUrl: row.logo_url ?? "",
    defaultCommissionRate: Number(row.default_commission_rate ?? 20),
    defaultVatRate: Number(row.default_vat_rate ?? 20),
    clientCategories: row.client_categories ?? "CHR, collectivite, commerce de bouche, autre",
    productCategories: row.product_categories ?? "Entretien, Vaisselle, Sanitaires, Technique, Ouate",
    currency: row.currency ?? "EUR",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
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

  const { data: existing, error: loadError } = await supabase.from("app_settings").select("id").eq("owner_user_id", user.id).maybeSingle();

  if (loadError) {
    return { ok: false, message: `Lecture des parametres impossible : ${loadError.message}` };
  }

  const { error: saveError } = existing
    ? await supabase.from("app_settings").update(payload).eq("id", existing.id).eq("owner_user_id", user.id)
    : await supabase.from("app_settings").insert(payload);

  if (saveError) {
    return { ok: false, message: `Enregistrement impossible : ${saveError.message}` };
  }

  return { ok: true, message: "Parametres enregistres." };
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase.from("app_settings").select("*").eq("owner_user_id", user.id).maybeSingle()
    : { data: null };

  const settings = data ? mapSettings(data) : appSettings;

  return (
    <>
      <PageHeader title="Parametres" description="Societe, email expediteur, commissions, TVA et categories." />
      <SettingsForm settings={settings} saveSettings={saveSettings} />
    </>
  );
}
