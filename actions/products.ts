"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";

export type SaveProductState = {
  ok: boolean;
  message: string;
  productId?: string;
};

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractMissingColumn(message: string) {
  const byPostgrest = message.match(/Could not find the '([^']+)' column/i)?.[1];
  if (byPostgrest) return byPostgrest;
  const byPostgres = message.match(/column "([^"]+)" of relation/i)?.[1] ?? message.match(/column "([^"]+)" does not exist/i)?.[1];
  return byPostgres ?? null;
}

async function persistProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  payload: Record<string, unknown>,
  isUpdate: boolean
) {
  const workingPayload = { ...payload };

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const query = isUpdate
      ? supabase.from("products").update(workingPayload).eq("id", productId).select("id").single()
      : supabase.from("products").insert(workingPayload).select("id").single();

    const { data, error } = await query;
    if (!error && data?.id) {
      return { ok: true as const, id: String(data.id) };
    }

    const message = error?.message ?? "Enregistrement produit impossible.";
    const missingColumn = extractMissingColumn(message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }

    return { ok: false as const, message };
  }

  return { ok: false as const, message: "Enregistrement produit impossible: compatibilite schema epuisee." };
}

export async function saveProduct(_previousState: SaveProductState, formData: FormData): Promise<SaveProductState> {
  const id = clean(formData.get("id"));
  const reference = clean(formData.get("reference"));
  const name = clean(formData.get("name"));

  if (!reference || !name) {
    return { ok: false, message: "Reference et nom produit sont obligatoires." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Authentification requise." };
  }

  const vatRate = toNumber(formData.get("vatRate"), 20);
  const payload: Record<string, unknown> = {
    owner_user_id: user.id,
    owner_id: user.id,
    reference,
    code: clean(formData.get("code")) || reference,
    code_produit: clean(formData.get("code")) || reference,
    name,
    nom_produit: name,
    category_id: clean(formData.get("categoryId")) || null,
    categorie_id: clean(formData.get("categoryId")) || null,
    brand: clean(formData.get("brand")) || "Biolaur",
    gamme: clean(formData.get("rangeName")) || null,
    range_name: clean(formData.get("rangeName")) || null,
    conditionnement: clean(formData.get("packaging")) || null,
    packaging: clean(formData.get("packaging")) || null,
    unite: clean(formData.get("unit")) || null,
    unit: clean(formData.get("unit")) || null,
    ean: clean(formData.get("ean")) || null,
    tva: vatRate,
    vat_rate: vatRate,
    short_description: clean(formData.get("shortDescription")) || null,
    description_courte: clean(formData.get("shortDescription")) || null,
    technical_sheet_url: clean(formData.get("technicalSheetUrl")) || null,
    fiche_technique_url: clean(formData.get("technicalSheetUrl")) || null,
    safety_sheet_url: clean(formData.get("safetySheetUrl")) || null,
    fiche_securite_url: clean(formData.get("safetySheetUrl")) || null,
    is_active: true,
    actif: true
  };

  const persisted = await persistProduct(supabase, id, payload, Boolean(id));
  if (!persisted.ok) {
    return { ok: false, message: persisted.message };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${persisted.id}`);

  return {
    ok: true,
    message: id ? "Produit mis a jour." : "Produit cree.",
    productId: persisted.id
  };
}
