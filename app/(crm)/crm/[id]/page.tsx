import Link from "next/link";
import { ArrowLeft, Mail, Phone, ShoppingCart } from "lucide-react";
import { createCommercialAction, saveProspectClient } from "@/actions/crm";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { EmailComposer } from "@/components/emails/email-composer";
import { CommercialActionForm } from "@/components/forms/commercial-action-form";
import { ClientForm } from "@/components/forms/client-form";
import { OrderItemsTable } from "@/components/orders/order-items-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/supabase/server";
import type { ActionStatus, CommercialAction, EmailLog, Order, OrderItem, ProspectClient } from "@/types/crm";

type HistoryEvent = {
  id: string;
  kind: "action" | "email" | "order";
  date: string;
  title: string;
  details?: string;
  status?: ActionStatus | Order["orderStatus"] | EmailLog["sendStatus"];
};

function toActionType(value: unknown): CommercialAction["actionType"] | undefined {
  if (value === "appel" || value === "visite" || value === "relance" || value === "email" || value === "rendez_vous" || value === "note") {
    return value;
  }
  return undefined;
}

function mapProspectClient(row: Record<string, unknown>): ProspectClient {
  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    recordType: row.record_type === "client" ? "client" : "prospect",
    companyName: String(row.company_name ?? ""),
    tradeName: String(row.trade_name ?? row.company_name ?? ""),
    clientType:
      row.client_type === "collectivite" || row.client_type === "commerce_de_bouche" || row.client_type === "autre"
        ? row.client_type
        : "CHR",
    commercialStatus:
      row.commercial_status === "en_cours" ||
      row.commercial_status === "relance" ||
      row.commercial_status === "gagne" ||
      row.commercial_status === "perdu" ||
      row.commercial_status === "actif" ||
      row.commercial_status === "inactif"
        ? row.commercial_status
        : "a_prospecter",
    siret: String(row.siret ?? ""),
    vatNumber: row.vat_number ? String(row.vat_number) : undefined,
    contactFirstName: String(row.contact_first_name ?? ""),
    contactLastName: String(row.contact_last_name ?? ""),
    contactJobTitle: String(row.contact_job_title ?? ""),
    phone: String(row.phone ?? ""),
    mobile: String(row.mobile ?? ""),
    email: String(row.email ?? ""),
    addressLine1: String(row.address_line_1 ?? ""),
    addressLine2: row.address_line_2 ? String(row.address_line_2) : undefined,
    postalCode: String(row.postal_code ?? ""),
    city: String(row.city ?? ""),
    country: String(row.country ?? "France"),
    geographicSector: String(row.geographic_sector ?? ""),
    notes: String(row.notes ?? ""),
    source: String(row.source ?? ""),
    lastInteractionAt: row.last_interaction_at ? String(row.last_interaction_at) : undefined,
    nextFollowUpAt: row.next_follow_up_at ? String(row.next_follow_up_at) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

function mapAction(row: Record<string, unknown>): CommercialAction {
  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    prospectClientId: String(row.prospect_client_id ?? ""),
    actionType:
      row.action_type === "visite" ||
      row.action_type === "relance" ||
      row.action_type === "email" ||
      row.action_type === "rendez_vous" ||
      row.action_type === "note"
        ? row.action_type
        : "appel",
    actionStatus: row.action_status === "fait" || row.action_status === "annule" ? row.action_status : "a_faire",
    actionDate: String(row.action_date ?? row.created_at ?? ""),
    summary: String(row.summary ?? ""),
    details: row.details ? String(row.details) : undefined,
    nextActionType: toActionType(row.next_action_type),
    nextActionDate: row.next_action_date ? String(row.next_action_date) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

function mapEmailLog(row: Record<string, unknown>, attachmentCount: number): EmailLog {
  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    prospectClientId: row.prospect_client_id ? String(row.prospect_client_id) : undefined,
    orderId: row.order_id ? String(row.order_id) : undefined,
    emailTemplateId: row.email_template_id ? String(row.email_template_id) : undefined,
    recipientEmail: String(row.recipient_email ?? ""),
    ccEmail: row.cc_email ? String(row.cc_email) : undefined,
    bccEmail: row.bcc_email ? String(row.bcc_email) : undefined,
    subject: String(row.subject ?? ""),
    body: String(row.body ?? ""),
    sendStatus: row.send_status === "draft" || row.send_status === "failed" ? row.send_status : "sent",
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    attachments: Array.from({ length: attachmentCount }).map((_, index) => ({
      id: `${row.id}-attachment-${index}`,
      emailLogId: String(row.id ?? ""),
      attachmentType: "other",
      fileName: "",
      fileUrl: "",
      createdAt: String(row.created_at ?? "")
    }))
  };
}

function mapOrder(row: Record<string, unknown>, items: OrderItem[], clientNameFallback: string): Order {
  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    orderNumber: String(row.order_number ?? ""),
    prospectClientId: String(row.prospect_client_id ?? ""),
    clientName: clientNameFallback,
    orderStatus:
      row.order_status === "envoyee" ||
      row.order_status === "validee" ||
      row.order_status === "livree" ||
      row.order_status === "payee" ||
      row.order_status === "annulee"
        ? row.order_status
        : "brouillon",
    orderDate: String(row.order_date ?? ""),
    deliveryAddressLine1: String(row.delivery_address_line_1 ?? ""),
    deliveryAddressLine2: row.delivery_address_line_2 ? String(row.delivery_address_line_2) : undefined,
    deliveryPostalCode: String(row.delivery_postal_code ?? ""),
    deliveryCity: String(row.delivery_city ?? ""),
    deliveryCountry: String(row.delivery_country ?? "France"),
    comments: row.comments ? String(row.comments) : undefined,
    subtotalHt: Number(row.subtotal_ht ?? 0),
    totalVat: Number(row.total_vat ?? 0),
    totalTtc: Number(row.total_ttc ?? 0),
    estimatedCommissionAmount: Number(row.estimated_commission_amount ?? 0),
    commissionRate: Number(row.commission_rate ?? 20),
    pdfUrl: row.pdf_url ? String(row.pdf_url) : undefined,
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    items
  };
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row.id ?? ""),
    orderId: String(row.order_id ?? ""),
    productId: row.product_id ? String(row.product_id) : undefined,
    productReference: String(row.product_reference ?? ""),
    productName: String(row.product_name ?? ""),
    quantity: Number(row.quantity ?? 0),
    unitPriceHt: Number(row.unit_price_ht ?? 0),
    discountPercent: Number(row.discount_percent ?? 0),
    vatRate: Number(row.vat_rate ?? 20),
    lineTotalHt: Number(row.line_total_ht ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

export default async function CrmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: recordRow, error: recordError }, { data: productsRows }, { data: actionRows, error: actionsError }, { data: emailRows, error: emailsError }, { data: orderRows, error: ordersError }] =
    await Promise.all([
      supabase.from("prospects_clients").select("*").eq("id", id).single(),
      supabase.from("products").select("id,reference,nom_produit").order("nom_produit", { ascending: true }),
      supabase.from("commercial_actions").select("*").eq("prospect_client_id", id),
      supabase.from("email_logs").select("*").eq("prospect_client_id", id),
      supabase.from("orders").select("*").eq("prospect_client_id", id)
    ]);

  const loadError = recordError ?? actionsError ?? emailsError ?? ordersError;
  if (loadError) {
    throw new Error(`Chargement CRM impossible: ${loadError.message}`);
  }

  if (!recordRow) {
    return (
      <div className="rounded-xl border border-line bg-white p-6">
        <Link href="/crm" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-leaf">
          <ArrowLeft className="h-4 w-4" />
          Retour CRM
        </Link>
        <h1 className="text-xl font-semibold text-ink">Fiche introuvable</h1>
      </div>
    );
  }

  const record = mapProspectClient(recordRow as Record<string, unknown>);
  const productOptions = (productsRows ?? []).map((product) => ({ id: String(product.id), reference: String(product.reference), name: String(product.nom_produit) }));
  const actions = (actionRows ?? []).map((row) => mapAction(row as Record<string, unknown>));

  const emailIds = (emailRows ?? []).map((row) => String(row.id));
  const { data: attachmentRows } = emailIds.length
    ? await supabase
        .from("email_log_attachments")
        .select("id,email_log_id,file_name,file_url,attachment_type,created_at")
        .in("email_log_id", emailIds)
    : { data: [] };
  const attachmentCountByEmailId = new Map<string, number>();
  for (const attachment of attachmentRows ?? []) {
    const key = String(attachment.email_log_id ?? "");
    attachmentCountByEmailId.set(key, (attachmentCountByEmailId.get(key) ?? 0) + 1);
  }
  const emails = (emailRows ?? []).map((row) =>
    mapEmailLog(row as Record<string, unknown>, attachmentCountByEmailId.get(String(row.id ?? "")) ?? 0)
  );
  const linkedDocuments = (attachmentRows ?? [])
    .map((attachment) => ({
      id: String(attachment.id ?? ""),
      fileName: String(attachment.file_name ?? "Document"),
      fileUrl: String(attachment.file_url ?? ""),
      attachmentType: String(attachment.attachment_type ?? "other"),
      createdAt: String(attachment.created_at ?? "")
    }))
    .filter((attachment) => attachment.fileUrl)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const orderIds = (orderRows ?? []).map((row) => String(row.id));
  const { data: orderItemRows, error: orderItemsError } = orderIds.length
    ? await supabase.from("order_items").select("*").in("order_id", orderIds).order("sort_order", { ascending: true })
    : { data: [], error: null };
  if (orderItemsError) {
    throw new Error(`Chargement lignes de commande impossible: ${orderItemsError.message}`);
  }

  const itemsByOrderId = new Map<string, OrderItem[]>();
  for (const itemRow of orderItemRows ?? []) {
    const item = mapOrderItem(itemRow as Record<string, unknown>);
    const existing = itemsByOrderId.get(item.orderId) ?? [];
    existing.push(item);
    itemsByOrderId.set(item.orderId, existing);
  }

  const orders = (orderRows ?? [])
    .map((row) => mapOrder(row as Record<string, unknown>, itemsByOrderId.get(String(row.id ?? "")) ?? [], record.tradeName || record.companyName))
    .sort((a, b) => String(b.orderDate).localeCompare(String(a.orderDate)));

  const history: HistoryEvent[] = [
    ...actions.map((action) => ({
      id: `action-${action.id}`,
      kind: "action" as const,
      date: action.actionDate,
      title: action.summary || "Action commerciale",
      details: action.details,
      status: action.actionStatus
    })),
    ...emails.map((email) => ({
      id: `email-${email.id}`,
      kind: "email" as const,
      date: email.sentAt ?? email.createdAt,
      title: `Email - ${email.subject}`,
      details: `${email.attachments.length} piece(s) jointe(s) historisee(s)`,
      status: email.sendStatus
    })),
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      kind: "order" as const,
      date: order.orderDate,
      title: `Commande - ${order.orderNumber}`,
      details: `Total HT ${formatCurrency(order.subtotalHt)}`,
      status: order.orderStatus
    }))
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const upcomingActions = actions
    .filter((action) => action.nextActionDate)
    .sort((a, b) => String(a.nextActionDate).localeCompare(String(b.nextActionDate)))
    .slice(0, 5);

  return (
    <>
      <Link href="/crm" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-leaf">
        <ArrowLeft className="h-4 w-4" />
        Retour CRM
      </Link>
      <PageHeader
        title={record.tradeName}
        description={`${record.companyName} - ${record.city} - ${record.contactFirstName} ${record.contactLastName}`}
        actions={
          <>
            <a href={`tel:${record.mobile}`} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium">
              <Phone className="h-4 w-4" />
              Appeler
            </a>
            <a href={`mailto:${record.email}`} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Email
            </a>
            {record.recordType === "client" ? (
              <Link href="/orders/new" className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-3 py-2 text-sm font-medium text-white">
                <ShoppingCart className="h-4 w-4" />
                Commander
              </Link>
            ) : (
              <button className="focus-ring rounded-md bg-leaf px-3 py-2 text-sm font-medium text-white">Transformer en client</button>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={record.recordType} />
              <StatusBadge status={record.commercialStatus} />
              <span className="rounded-full border border-line px-2.5 py-1 text-xs text-slate-600">{record.clientType}</span>
              <span className="rounded-full border border-line px-2.5 py-1 text-xs text-slate-600">{record.geographicSector}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Info label="Contact" value={`${record.contactFirstName} ${record.contactLastName} - ${record.contactJobTitle}`} />
              <Info label="Mobile" value={record.mobile} />
              <Info label="Email" value={record.email} />
              <Info label="Adresse" value={`${record.addressLine1}, ${record.postalCode} ${record.city}`} />
              <Info label="SIRET" value={record.siret} />
              <Info label="Derniere interaction" value={formatDate(record.lastInteractionAt)} />
            </div>
            <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{record.notes}</p>
          </section>

          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 font-semibold text-ink">Historique complet</h2>
            <div className="mb-4">
              <CommercialActionForm prospectClientId={record.id} createCommercialAction={createCommercialAction} />
            </div>
            <div className="space-y-3">
              {history.map((event) => (
                <div key={event.id} className="rounded-md border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{event.title}</p>
                    {event.kind === "action" ? <StatusBadge status={event.status as ActionStatus} /> : null}
                    {event.kind === "order" ? <StatusBadge status={event.status as Order["orderStatus"]} /> : null}
                    {event.kind === "email" ? (
                      <StatusBadge
                        status={
                          event.status === "sent" ? "fait" : event.status === "failed" ? "annule" : "a_faire"
                        }
                      />
                    ) : null}
                  </div>
                  {event.details ? <p className="mt-1 text-sm text-slate-600">{event.details}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">{formatDate(event.date)}</p>
                </div>
              ))}
              {!history.length ? <p className="text-sm text-slate-500">Aucun evenement historise pour cette fiche.</p> : null}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-ink">Commandes</h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/orders/${order.id}`} className="font-medium text-ink hover:text-leaf">
                      {order.orderNumber}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.orderStatus} />
                      <span className="text-sm font-semibold">{formatCurrency(order.subtotalHt)}</span>
                    </div>
                  </div>
                  <OrderItemsTable items={order.items} />
                </div>
              ))}
              {!orders.length ? <p className="rounded-md border border-dashed border-line bg-white p-3 text-sm text-slate-500">Aucune commande rattachee a cette fiche.</p> : null}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-ink">Emails et documents</h2>
            <EmailComposer prospectClientId={record.id} />
            <DocumentUploader prospectClientId={record.id} products={productOptions} />
            <div className="grid gap-3 md:grid-cols-2">
              {linkedDocuments.map((document) => (
                <a
                  key={document.id}
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-line bg-white p-3 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-ink">{document.fileName}</span>
                  <span className="block text-xs text-slate-500">{document.attachmentType}</span>
                </a>
              ))}
              {!linkedDocuments.length ? (
                <p className="rounded-md border border-dashed border-line bg-white p-3 text-sm text-slate-500">
                  Aucun document lie a cette fiche.
                </p>
              ) : null}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-ink">Modifier la fiche</h2>
            <ClientForm record={record} mode="edit" saveProspectClient={saveProspectClient} />
          </section>
        </div>
        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 font-semibold text-ink">Prochaines relances</h2>
            <div className="space-y-3">
              {upcomingActions.map((action) => (
                <div key={action.id} className="rounded-md border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{action.summary}</p>
                    <StatusBadge status={action.actionStatus} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(action.nextActionDate)}</p>
                </div>
              ))}
              {!upcomingActions.length ? <p className="text-sm text-slate-500">Aucune relance planifiee.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || "-"}</p>
    </div>
  );
}
