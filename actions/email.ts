"use server";

import { revalidatePath } from "next/cache";
import { createOrderPdf } from "@/lib/pdf/order-pdf";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type EmailAttachmentInput = {
  type: "product_document" | "order_pdf";
  id: string;
};

type SendEmailInput = {
  prospectClientId?: string;
  clientId?: string;
  orderId?: string;
  templateId?: string;
  to: string;
  subject: string;
  body: string;
  attachments: EmailAttachmentInput[];
};

type PreparedAttachment = {
  attachmentType: "product_document" | "order_pdf" | "client_document" | "other";
  productDocumentId?: string;
  fileName: string;
  fileUrl: string;
  brevo: { name: string; content: string } | { name: string; url: string };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmailFrom(value?: string) {
  if (!value) return "";
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function parseRecipients(value: string) {
  return value
    .split(/[,\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parseEmailFrom(item));
}

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

function stringifyBrevoError(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const row = payload as Record<string, unknown>;
  const message = typeof row.message === "string" ? row.message : "";
  const code = typeof row.code === "string" ? row.code : "";
  return [code, message].filter(Boolean).join(" - ");
}

function extractMissingColumn(message: string) {
  const fromPostgrest = message.match(/Could not find the '([^']+)' column/i)?.[1];
  if (fromPostgrest) return fromPostgrest;
  const fromPostgres = message.match(/column "([^"]+)" of relation/i)?.[1] ?? message.match(/column "([^"]+)" does not exist/i)?.[1];
  return fromPostgres ?? null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveStorageObject(value?: string | null, fallbackBucket = "technical-sheets") {
  if (!value) return null;

  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex >= 0) {
      const objectPath = url.pathname.slice(markerIndex + marker.length).replace(/^public\//, "").replace(/^sign\//, "");
      const [bucket, ...pathParts] = objectPath.split("/");
      return bucket && pathParts.length ? { bucket, path: decodeURIComponent(pathParts.join("/")) } : null;
    }
  } catch {
    // Not a URL; treat it as a storage path.
  }

  const cleaned = value.replace(/^\/+/, "");
  const [bucketCandidate, ...pathParts] = cleaned.split("/");
  if (["technical-sheets", "safety-sheets", "order-pdfs", "client-documents"].includes(bucketCandidate) && pathParts.length) {
    return { bucket: bucketCandidate, path: pathParts.join("/") };
  }

  return { bucket: fallbackBucket, path: cleaned };
}

async function blobToBase64(blob: Blob) {
  const buffer = Buffer.from(await blob.arrayBuffer());
  return buffer.toString("base64");
}

async function insertEmailLog(supabase: ReturnType<typeof createAdminClient>, input: SendEmailInput, userId: string) {
  const prospectClientId = input.prospectClientId ?? input.clientId ?? null;
  const payload: Record<string, unknown> = {
    owner_user_id: userId,
    owner_id: userId,
    prospect_client_id: prospectClientId,
    client_id: prospectClientId,
    order_id: input.orderId || null,
    email_template_id: input.templateId || null,
    template_id: input.templateId || null,
    recipient_email: input.to,
    to_email: input.to,
    subject: input.subject,
    body: input.body,
    send_status: "sent",
    status: "sent",
    sent_at: new Date().toISOString()
  };

  const workingPayload = { ...payload };
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const { data, error } = await supabase.from("email_logs").insert(workingPayload).select("id").single();
    if (!error && data?.id) return data.id as string;

    const message = error?.message ?? "Insertion email_logs impossible.";
    const missingColumn = extractMissingColumn(message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }

    throw new Error(message);
  }

  throw new Error("Insertion email_logs impossible: compatibilite schema epuisee.");
}

async function insertEmailAttachments(
  supabase: ReturnType<typeof createAdminClient>,
  emailLogId: string,
  ownerUserId: string,
  attachments: PreparedAttachment[]
) {
  if (!attachments.length) return;

  const rows = attachments.map((attachment) => ({
    owner_user_id: ownerUserId,
    email_log_id: emailLogId,
    attachment_type: attachment.attachmentType,
    product_document_id: attachment.productDocumentId ?? null,
    file_name: attachment.fileName,
    file_url: attachment.fileUrl
  }));

  const { error } = await supabase.from("email_log_attachments").insert(rows);
  if (!error) return;

  const { error: retryError } = await supabase.from("email_log_attachments").insert(
    rows.map(({ owner_user_id: _ownerUserId, ...row }) => row)
  );

  if (retryError) throw retryError;
}

async function prepareAttachments(supabase: ReturnType<typeof createAdminClient>, input: SendEmailInput, ownerUserId: string) {
  const prepared: PreparedAttachment[] = [];
  const productDocumentIds = input.attachments.filter((item) => item.type === "product_document").map((item) => item.id);

  if (productDocumentIds.length) {
    const { data, error } = await supabase
      .from("product_documents")
      .select("id,document_type,title,file_name,storage_path,public_url")
      .in("id", productDocumentIds);

    if (error) throw error;

    for (const document of data ?? []) {
      const fallbackBucket = document.document_type === "fiche_securite" ? "safety-sheets" : "technical-sheets";
      const storageObject = resolveStorageObject(document.storage_path ?? document.public_url, fallbackBucket);
      const fileName = document.file_name || `${document.title}.pdf`;

      if (storageObject) {
        const { data: file, error: downloadError } = await supabase.storage.from(storageObject.bucket).download(storageObject.path);
        if (downloadError) throw downloadError;

        prepared.push({
          attachmentType: "product_document",
          productDocumentId: document.id,
          fileName,
          fileUrl: `${storageObject.bucket}/${storageObject.path}`,
          brevo: { name: fileName, content: await blobToBase64(file) }
        });
      } else if (document.public_url) {
        prepared.push({
          attachmentType: "product_document",
          productDocumentId: document.id,
          fileName,
          fileUrl: document.public_url,
          brevo: { name: fileName, url: document.public_url }
        });
      }
    }
  }

  const shouldAttachOrderPdf = input.attachments.some((item) => item.type === "order_pdf") && input.orderId;
  if (shouldAttachOrderPdf && input.orderId) {
    const pdf = await createOrderPdf(input.orderId, ownerUserId);
    const fileName = `bon-de-commande-${input.orderId}.pdf`;
    prepared.push({
      attachmentType: "order_pdf",
      fileName,
      fileUrl: `/api/orders/${input.orderId}/pdf`,
      brevo: { name: fileName, content: Buffer.from(pdf).toString("base64") }
    });
  }

  return prepared;
}

export async function sendCrmEmail(input: SendEmailInput) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return { ok: false, message: "Authentification requise." };

    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = parseEmailFrom(process.env.EMAIL_FROM);
    const senderName = process.env.EMAIL_FROM_NAME ?? "Biolaur CRM";

    if (!brevoApiKey) return { ok: false, message: "BREVO_API_KEY manquant dans .env.local." };
    if (!senderEmail) return { ok: false, message: "EMAIL_FROM manquant dans .env.local." };
    if (!input.to || !input.subject) return { ok: false, message: "Destinataire et objet requis." };

    const recipients = parseRecipients(input.to);
    if (!recipients.length) {
      return { ok: false, message: "Aucun destinataire valide detecte." };
    }

    const invalidRecipients = recipients.filter((email) => !isValidEmail(email));
    if (invalidRecipients.length) {
      return { ok: false, message: `Adresse email invalide: ${invalidRecipients[0]}` };
    }

    const supabase = createAdminClient();
    const attachments = await prepareAttachments(supabase, input, user.id);

    const responseBrevo = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: recipients.map((email) => ({ email })),
        subject: input.subject,
        htmlContent: `<p>${escapeHtml(input.body).replaceAll("\n", "<br />")}</p>`,
        textContent: input.body,
        attachment: attachments.map((attachment) => attachment.brevo)
      })
    });

    const brevoPayload = await responseBrevo.json().catch(() => null);
    if (!responseBrevo.ok) {
      const details = stringifyBrevoError(brevoPayload);
      console.error("BREVO SEND ERROR", {
        status: responseBrevo.status,
        details: details || brevoPayload,
        recipients,
        subject: input.subject,
        attachmentCount: attachments.length
      });
      return {
        ok: false,
        message: details ? `Echec de l'envoi Brevo: ${details}` : "Echec de l'envoi Brevo.",
        details: brevoPayload
      };
    }

    const emailLogId = await insertEmailLog(supabase, input, user.id);
    await insertEmailAttachments(supabase, emailLogId, user.id, attachments);

    revalidatePath("/emails");
    return { ok: true, message: "Email envoye et historise.", emailLogId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Envoi email impossible."
    };
  }
}
