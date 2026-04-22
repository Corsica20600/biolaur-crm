"use server";

import { createClient } from "@/supabase/server";

export async function uploadDocument(formData: FormData) {
  const file = formData.get("file");
  const type = String(formData.get("type") ?? "commercial");
  const prospectClientId = String(formData.get("prospectClientId") ?? "");
  const productId = String(formData.get("productId") ?? "");

  if (!(file instanceof File)) {
    return { ok: false, message: "Aucun fichier fourni." };
  }

  const supabase = await createClient();
  const bucket =
    type === "fiche_technique"
      ? "technical-sheets"
      : type === "fiche_securite"
        ? "safety-sheets"
        : type === "bon_commande"
          ? "order-pdfs"
          : "client-documents";
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  const { error: insertError } = productId
    ? await supabase.from("product_documents").insert({
        title: file.name,
        document_type: type,
        file_name: file.name,
        storage_path: `${bucket}/${path}`,
        mime_type: file.type,
        product_id: productId
      })
    : { error: null };

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  return { ok: true, message: `Document envoye dans ${bucket}.`, prospectClientId };
}
