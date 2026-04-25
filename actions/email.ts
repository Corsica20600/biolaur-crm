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

function extractForeignKeyColumn(message: string) {
  const constraint = message.match(/foreign key constraint "([^"]+)"/i)?.[1] ?? "";
  if (constraint.includes("_client_id_")) return "client_id";
  if (constraint.includes("_order_id_")) return "order_id";
  if (constraint.includes("_template_id_")) return "template_id";
  if (constraint.includes("_email_template_id_")) return "email_template_id";
  return null;
}

function isMissingOwnerUserColumn(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("owner_user_id") && (lower.includes("column") || lower.includes("could not find"));
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function readField(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined) return value;
  }
  return undefined;
}

function isOptOut(row: Record<string, unknown>) {
  const value = readField(row, "opt_out", "ne_plus_contacter", "do_not_contact", "blacklisted");
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "oui" || normalized === "yes";
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

async function resolveLegacyClientId(
  supabase: ReturnType<typeof createAdminClient>,
  ownerUserId: string,
  prospectRow: Record<string, unknown> | null,
  orderId?: string
) {
  if (orderId) {
    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .select("id,owner_user_id,client_id")
      .eq("id", orderId)
      .eq("owner_user_id", ownerUserId)
      .maybeSingle();

    if (!orderError) {
      const orderClientId = String(readField((orderRow as Record<string, unknown> | null) ?? {}, "client_id") ?? "");
      if (orderClientId) return orderClientId;
    }
  }

  if (!prospectRow) return null;

  const prospectId = String(readField(prospectRow, "id") ?? "");
  const prospectEmail = normalizeText(readField(prospectRow, "email", "contact_email", "mail"));
  const prospectNames = [
    normalizeText(readField(prospectRow, "trade_name")),
    normalizeText(readField(prospectRow, "company_name")),
    normalizeText(readField(prospectRow, "name"))
  ].filter(Boolean);

  const { data: clients, error } = await supabase.from("clients").select("*").eq("owner_user_id", ownerUserId).limit(500);
  if (error || !clients?.length) return null;

  const rows = clients as Record<string, unknown>[];

  const direct = rows.find((row) => String(readField(row, "id") ?? "") === prospectId);
  if (direct) return String(readField(direct, "id") ?? "");

  const linked = rows.find((row) => {
    const linkedId = String(readField(row, "prospect_client_id", "prospect_id", "prospectId", "crm_prospect_id") ?? "");
    return linkedId && linkedId === prospectId;
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

  return null;
}

async function insertEmailLog(supabase: ReturnType<typeof createAdminClient>, input: SendEmailInput, userId: string) {
  const prospectClientId = input.prospectClientId ?? null;
  const payload: Record<string, unknown> = {
    owner_user_id: userId,
    owner_id: userId,
    prospect_client_id: prospectClientId,
    client_id: input.clientId ?? null,
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

    const foreignKeyColumn = extractForeignKeyColumn(message);
    if (foreignKeyColumn && Object.prototype.hasOwnProperty.call(workingPayload, foreignKeyColumn)) {
      delete workingPayload[foreignKeyColumn];
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

async function insertCommercialActionDone(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  prospectClientId: string | undefined,
  legacyClientId: string | undefined,
  subject: string,
  body: string
) {
  if (!prospectClientId) return;

  const payload: Record<string, unknown> = {
    owner_user_id: userId,
    owner_id: userId,
    prospect_client_id: prospectClientId,
    client_id: legacyClientId ?? null,
    action_type: "email",
    type: "email",
    action_status: "fait",
    statut: "fait",
    action_date: new Date().toISOString(),
    date_action: new Date().toISOString(),
    summary: `Email envoye: ${subject}`,
    compte_rendu: `Email envoye: ${subject}`,
    details: body,
    prochaine_action: body
  };

  const workingPayload = { ...payload };
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const { error } = await supabase.from("commercial_actions").insert(workingPayload);
    if (!error) return;

    const message = error.message ?? "Insertion commercial_actions impossible.";
    const missingColumn = extractMissingColumn(message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }

    if (isMissingOwnerUserColumn(message) && Object.prototype.hasOwnProperty.call(workingPayload, "owner_user_id")) {
      delete workingPayload.owner_user_id;
      continue;
    }

    throw new Error(message);
  }
}

function orderStatusRank(status: string) {
  if (status === "payee") return 4;
  if (status === "livree") return 3;
  if (status === "validee") return 2;
  if (status === "envoyee") return 1;
  if (status === "brouillon") return 0;
  if (status === "annulee") return -1;
  return 0;
}

async function promoteOrderStatus(
  supabase: ReturnType<typeof createAdminClient>,
  ownerUserId: string,
  orderId: string | undefined,
  minimumStatus: "envoyee" | "validee"
) {
  if (!orderId) return;

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (orderError || !orderRow) return;

  const currentRaw = String(readField(orderRow as Record<string, unknown>, "order_status", "statut") ?? "brouillon");
  if (currentRaw === "annulee") return;

  const nextStatus = orderStatusRank(currentRaw) >= orderStatusRank(minimumStatus) ? currentRaw : minimumStatus;
  if (nextStatus === currentRaw && readField(orderRow as Record<string, unknown>, "sent_at")) return;

  const payload: Record<string, unknown> = {
    order_status: nextStatus,
    statut: nextStatus,
    sent_at: new Date().toISOString()
  };

  const workingPayload = { ...payload };
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { error } = await supabase
      .from("orders")
      .update(workingPayload)
      .eq("id", orderId)
      .eq("owner_user_id", ownerUserId);

    if (!error) return;

    const message = error.message ?? "Mise a jour statut commande impossible.";
    const missingColumn = extractMissingColumn(message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }
    return;
  }
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
    let prospectRow: Record<string, unknown> | null = null;
    if (input.prospectClientId) {
      const { data, error: prospectError } = await supabase
        .from("prospects_clients")
        .select("*")
        .eq("id", input.prospectClientId)
        .maybeSingle();
      if (prospectError) return { ok: false, message: prospectError.message };
      prospectRow = (data as Record<string, unknown> | null) ?? null;
      if (prospectRow && isOptOut(prospectRow)) {
        return { ok: false, message: "Envoi bloque: ce contact est opt-out / ne plus contacter." };
      }
    }

    const legacyClientId = await resolveLegacyClientId(supabase, user.id, prospectRow, input.orderId);
    const emailInput: SendEmailInput = {
      ...input,
      clientId: legacyClientId ?? undefined
    };

    const attachments = await prepareAttachments(supabase, emailInput, user.id);

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

    try {
      const emailLogId = await insertEmailLog(supabase, emailInput, user.id);
      await insertEmailAttachments(supabase, emailLogId, user.id, attachments);
      await insertCommercialActionDone(supabase, user.id, emailInput.prospectClientId, emailInput.clientId, emailInput.subject, emailInput.body);
      await promoteOrderStatus(supabase, user.id, emailInput.orderId, "envoyee");

      revalidatePath("/emails");
      revalidatePath("/actions");
      if (emailInput.orderId) revalidatePath(`/orders/${emailInput.orderId}`);
      return { ok: true, message: "Email envoye et historise.", emailLogId };
    } catch (historyError) {
      const historyMessage = historyError instanceof Error ? historyError.message : "Historisation email impossible.";
      console.error("EMAIL HISTORY ERROR", {
        userId: user.id,
        prospectClientId: emailInput.prospectClientId,
        orderId: emailInput.orderId,
        recipient: emailInput.to,
        subject: emailInput.subject,
        historyMessage
      });

      revalidatePath("/emails");
      revalidatePath("/actions");
      const isLegacyConstraintIssue =
        historyMessage.toLowerCase().includes("email_logs") &&
        (historyMessage.toLowerCase().includes("client_id") || historyMessage.toLowerCase().includes("foreign key"));
      return {
        ok: true,
        message: isLegacyConstraintIssue
          ? "Email envoye. Historisation partielle indisponible sur ce schema legacy."
          : "Email envoye. Historisation partielle indisponible."
      };
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Envoi email impossible."
    };
  }
}
