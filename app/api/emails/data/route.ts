import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

function mapTemplate(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    subjectTemplate: row.subject_template ?? row.subject ?? "",
    bodyTemplate: row.body_template ?? row.body ?? "",
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRecipient(row: any) {
  return {
    id: row.id,
    label: row.nom_commercial || row.raison_sociale || row.trade_name || row.company_name || "Client",
    companyName: row.raison_sociale || row.company_name || "",
    email: row.email || ""
  };
}

function mapOrder(row: any) {
  return {
    id: row.id,
    orderNumber: row.numero_commande ?? row.order_number ?? row.id,
    clientId: row.client_id ?? row.prospect_client_id ?? ""
  };
}

function mapProductDocument(row: any) {
  const product = row.products ?? {};
  return {
    id: row.id,
    productId: row.product_id,
    documentType: row.document_type,
    title: row.title,
    fileName: row.file_name,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    productReference: product.reference ?? "",
    productName: product.nom_produit ?? product.name ?? ""
  };
}

function mapAttachment(row: any) {
  return {
    id: row.id,
    emailLogId: row.email_log_id,
    attachmentType: row.attachment_type,
    productDocumentId: row.product_document_id,
    fileName: row.file_name ?? "",
    fileUrl: row.file_url ?? "",
    createdAt: row.created_at
  };
}

function mapEmailLog(row: any, attachments: any[]) {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? row.owner_id,
    prospectClientId: row.prospect_client_id ?? row.client_id,
    orderId: row.order_id,
    emailTemplateId: row.email_template_id ?? row.template_id,
    recipientEmail: row.recipient_email ?? row.to_email ?? "",
    ccEmail: row.cc_email,
    bccEmail: row.bcc_email,
    subject: row.subject ?? "",
    body: row.body ?? "",
    sendStatus: row.send_status ?? row.status ?? "sent",
    sentAt: row.sent_at ?? row.created_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    attachments: attachments.filter((attachment) => attachment.emailLogId === row.id)
  };
}

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const supabase = createAdminClient();

    const [
      { data: templates, error: templatesError },
      clientsResponse,
      prospectsResponse,
      { data: orders, error: ordersError },
      { data: documents, error: documentsError },
      { data: emailLogs, error: emailLogsError }
    ] = await Promise.all([
      supabase.from("email_templates").select("*").eq("is_active", true).order("name"),
      supabase.from("clients").select("*").eq("owner_user_id", user.id).order("raison_sociale"),
      supabase.from("prospects_clients").select("*").eq("owner_user_id", user.id).order("company_name"),
      supabase.from("orders").select("*").eq("owner_user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("product_documents").select("*, products(*)").order("created_at", { ascending: false }),
      supabase.from("email_logs").select("*").eq("owner_user_id", user.id).order("created_at", { ascending: false })
    ]);

    const error = templatesError ?? ordersError ?? documentsError ?? emailLogsError;
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    const clients = clientsResponse.error ? [] : clientsResponse.data ?? [];
    const prospects = prospectsResponse.error ? [] : prospectsResponse.data ?? [];
    const recipientRows = clients.length ? clients : prospects;
    const emailLogIds = (emailLogs ?? []).map((log) => log.id);
    const { data: attachments, error: attachmentsError } = emailLogIds.length
      ? await supabase.from("email_log_attachments").select("*").in("email_log_id", emailLogIds)
      : { data: [], error: null };

    if (attachmentsError) return NextResponse.json({ ok: false, error: attachmentsError.message }, { status: 500 });

    const mappedAttachments = (attachments ?? []).map(mapAttachment);

    return NextResponse.json({
      ok: true,
      templates: (templates ?? []).map(mapTemplate),
      recipients: recipientRows.map(mapRecipient),
      orders: (orders ?? []).map(mapOrder),
      productDocuments: (documents ?? []).map(mapProductDocument),
      emailLogs: (emailLogs ?? []).map((log) => mapEmailLog(log, mappedAttachments))
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Chargement emails impossible." },
      { status: 500 }
    );
  }
}
