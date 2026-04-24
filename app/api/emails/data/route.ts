import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

function asRow(value: unknown): DbRow {
  return value && typeof value === "object" ? (value as DbRow) : {};
}

function mapTemplate(row: DbRow) {
  return {
    id: String(row.id ?? ""),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    subjectTemplate: String(row.subject_template ?? row.subject ?? ""),
    bodyTemplate: String(row.body_template ?? row.body ?? ""),
    isActive: Boolean(row.is_active ?? true),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

function readField(row: DbRow, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function mapRecipient(row: DbRow) {
  return {
    id: String(row.id ?? ""),
    label: String(row.trade_name ?? row.company_name ?? "Client"),
    companyName: String(row.company_name ?? ""),
    email: String(row.email ?? "")
  };
}

function mapOrder(row: DbRow) {
  const prospectClientId = String(row.prospect_client_id ?? "");
  return {
    id: String(row.id ?? ""),
    orderNumber: String(row.order_number ?? row.id ?? ""),
    prospectClientId,
    clientId: prospectClientId
  };
}

function mapProductDocument(row: DbRow) {
  const product = asRow(row.products);
  return {
    id: String(row.id ?? ""),
    productId: String(row.product_id ?? ""),
    documentType: String(row.document_type ?? ""),
    title: String(row.title ?? ""),
    fileName: String(row.file_name ?? ""),
    storagePath: String(row.storage_path ?? ""),
    publicUrl: String(row.public_url ?? ""),
    productReference: String(product.reference ?? ""),
    productName: String(product.nom_produit ?? product.name ?? "")
  };
}

function mapAttachment(row: DbRow) {
  return {
    id: String(row.id ?? ""),
    emailLogId: String(row.email_log_id ?? ""),
    attachmentType: String(row.attachment_type ?? ""),
    productDocumentId: row.product_document_id ? String(row.product_document_id) : undefined,
    fileName: String(row.file_name ?? ""),
    fileUrl: String(row.file_url ?? ""),
    createdAt: String(row.created_at ?? "")
  };
}

function mapEmailLog(row: DbRow, attachments: ReturnType<typeof mapAttachment>[]) {
  const sendStatusRaw = String(readField(row, "send_status", "status") ?? "sent");
  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    prospectClientId: row.prospect_client_id ? String(row.prospect_client_id) : undefined,
    orderId: row.order_id ? String(row.order_id) : undefined,
    emailTemplateId: readField(row, "email_template_id", "template_id") ? String(readField(row, "email_template_id", "template_id")) : undefined,
    recipientEmail: String(readField(row, "recipient_email", "to_email") ?? ""),
    ccEmail: row.cc_email ? String(row.cc_email) : undefined,
    bccEmail: row.bcc_email ? String(row.bcc_email) : undefined,
    subject: String(row.subject ?? ""),
    body: String(row.body ?? ""),
    sendStatus: sendStatusRaw === "draft" || sendStatusRaw === "failed" ? sendStatusRaw : "sent",
    sentAt: row.sent_at ? String(row.sent_at) : String(row.created_at ?? ""),
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? row.created_at ?? ""),
    attachments: attachments.filter((attachment) => attachment.emailLogId === String(row.id ?? ""))
  };
}

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const supabase = createAdminClient();

    const [
      { data: templates, error: templatesError },
      { data: recipients, error: recipientsError },
      { data: orders, error: ordersError },
      { data: documents, error: documentsError },
      { data: emailLogs, error: emailLogsError }
    ] = await Promise.all([
      supabase.from("email_templates").select("*").eq("is_active", true).order("name"),
      supabase.from("prospects_clients").select("id,company_name,trade_name,email").eq("owner_user_id", user.id).order("company_name"),
      supabase.from("orders").select("*").eq("owner_user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("product_documents").select("*, products(*)").order("created_at", { ascending: false }),
      supabase.from("email_logs").select("*").eq("owner_user_id", user.id).order("created_at", { ascending: false })
    ]);

    const error = templatesError ?? recipientsError ?? ordersError ?? documentsError ?? emailLogsError;
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    const recipientRows = recipients ?? [];
    const emailLogIds = (emailLogs ?? []).map((log) => log.id);
    const { data: attachments, error: attachmentsError } = emailLogIds.length
      ? await supabase.from("email_log_attachments").select("*").in("email_log_id", emailLogIds)
      : { data: [], error: null };

    if (attachmentsError) return NextResponse.json({ ok: false, error: attachmentsError.message }, { status: 500 });

    const mappedAttachments = (attachments ?? []).map(mapAttachment);

    return NextResponse.json({
      ok: true,
      templates: (templates ?? []).map((row) => mapTemplate(asRow(row))),
      recipients: recipientRows.map((row) => mapRecipient(asRow(row))),
      orders: (orders ?? []).map((row) => mapOrder(asRow(row))),
      productDocuments: (documents ?? []).map((row) => mapProductDocument(asRow(row))),
      emailLogs: (emailLogs ?? []).map((row) => mapEmailLog(asRow(row), mappedAttachments))
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Chargement emails impossible." },
      { status: 500 }
    );
  }
}
