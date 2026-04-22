import Link from "next/link";
import { ArrowLeft, Mail, Phone, ShoppingCart } from "lucide-react";
import { NextActionWidget } from "@/components/actions/next-action-widget";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { EmailComposer } from "@/components/emails/email-composer";
import { ClientForm } from "@/components/forms/client-form";
import { OrderItemsTable } from "@/components/orders/order-items-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { commercialActions, emailLogs, orders, productDocuments, prospectsClients } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CrmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = prospectsClients.find((item) => item.id === id) ?? prospectsClients[0];
  const recordOrders = orders.filter((order) => order.prospectClientId === record.id);
  const recordActions = commercialActions.filter((action) => action.prospectClientId === record.id);
  const recordEmails = emailLogs.filter((email) => email.prospectClientId === record.id);

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
            <div className="space-y-3">
              {recordActions.map((action) => (
                <div key={action.id} className="rounded-md border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{action.summary}</p>
                    <StatusBadge status={action.actionStatus} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{action.details}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(action.actionDate)}</p>
                </div>
              ))}
              {recordEmails.map((email) => (
                <div key={email.id} className="rounded-md border border-line p-3">
                  <p className="text-sm font-medium text-ink">Email - {email.subject}</p>
                  <p className="mt-1 text-sm text-slate-600">{email.attachments.length} piece(s) jointe(s) historisee(s)</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(email.sentAt)}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-ink">Commandes</h2>
            <div className="space-y-4">
              {recordOrders.map((order) => (
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
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-ink">Emails et documents</h2>
            <EmailComposer prospectClientId={record.id} />
            <DocumentUploader prospectClientId={record.id} />
            <div className="grid gap-3 md:grid-cols-2">
              {productDocuments.slice(0, 4).map((doc) => (
                <a key={doc.id} href={doc.publicUrl} className="rounded-md border border-line bg-white p-3 text-sm hover:bg-slate-50">
                  <span className="font-medium text-ink">{doc.title}</span>
                  <span className="block text-xs text-slate-500">{doc.documentType}</span>
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-ink">Modifier la fiche</h2>
            <ClientForm record={record} mode="edit" />
          </section>
        </div>
        <NextActionWidget prospectClientId={record.id} />
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
