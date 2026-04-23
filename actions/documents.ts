"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";

export type UploadDocumentState = {
  ok: boolean;
  message: string;
};

function normalizeDocumentType(value: string) {
  if (value === "fiche_technique") return "fiche_technique";
  if (value === "fiche_securite") return "fiche_securite";
  if (value === "bon_commande") return "bon_commande";
  return "autre";
}

function resolveBucket(type: string) {
  if (type === "fiche_technique") return "technical-sheets";
  if (type === "fiche_securite") return "safety-sheets";
  if (type === "bon_commande") return "order-pdfs";
  return "client-documents";
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function uploadDocument(_previousState: UploadDocumentState, formData: FormData): Promise<UploadDocumentState> {
  const file = formData.get("file");
  const type = normalizeDocumentType(String(formData.get("type") ?? "autre"));
  const productId = String(formData.get("productId") ?? "");

  if (!(file instanceof File)) {
    return { ok: false, message: "Aucun fichier fourni." };
  }
  if (!productId) {
    return { ok: false, message: "Produit requis pour associer le document." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Authentification requise." };
  }

  const bucket = resolveBucket(type);
  const safeName = sanitizeFileName(file.name);
  const path =
    bucket === "order-pdfs" || bucket === "client-documents"
      ? `${user.id}/${productId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
      : `${productId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || "application/pdf"
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  const fileUrl = publicUrlData.publicUrl;
  const { error: insertError } = await supabase.from("product_documents").insert({
    product_id: productId,
    document_type: type,
    title: file.name,
    file_name: file.name,
    storage_path: `${bucket}/${path}`,
    public_url: fileUrl,
    mime_type: file.type || "application/octet-stream"
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  revalidatePath("/documents");
  revalidatePath(`/products/${productId}`);

  return { ok: true, message: `Document envoye dans ${bucket} et enregistre en base.` };
}
