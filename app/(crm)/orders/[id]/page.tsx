"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, FileDown, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { EmailComposer } from "@/components/emails/email-composer";
import { OrderItemsTable } from "@/components/orders/order-items-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { emailLogs } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types/crm";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [remoteOrder, setRemoteOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRemoteOrder() {
      const response = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
      setLoading(false);
      if (!response.ok) return;
      const payload = (await response.json()) as { ok: boolean; order?: Order };
      if (payload.ok && payload.order) setRemoteOrder(payload.order);
    }

    loadRemoteOrder();
  }, [params.id]);

  const order = remoteOrder;
  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Chargement de la commande...</div>;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-leaf">
          <ArrowLeft className="h-4 w-4" />
          Retour commandes
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-700">
          Commande introuvable dans Supabase.
        </div>
      </div>
    );
  }
  const orderEmails = emailLogs.filter((email) => email.orderId === order.id);

  return (
    <>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-leaf">
        <ArrowLeft className="h-4 w-4" />
        Retour commandes
      </Link>
      <PageHeader
        title={order.orderNumber}
        description={`${order.clientName ?? "Client"} - ${formatDate(order.orderDate)}`}
        actions={
          <>
            <a href={`/api/orders/${order.id}/pdf`} target="_blank" className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium">
              <FileDown className="h-4 w-4" />
              PDF
            </a>
            <button className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Envoyer
            </button>
            <Link href="/orders/new" className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-3 py-2 text-sm font-medium text-white">
              <Copy className="h-4 w-4" />
              Dupliquer
            </Link>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={order.orderStatus} />
              <div className="text-right">
                <p className="text-sm text-slate-500">Total HT</p>
                <p className="text-2xl font-semibold text-ink">{formatCurrency(order.subtotalHt)}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Info label="Client" value={order.clientName} />
              <Info label="Livraison" value={`${order.deliveryAddressLine1}, ${order.deliveryPostalCode} ${order.deliveryCity}`} />
              <Info label="Commission estimee" value={formatCurrency(order.estimatedCommissionAmount)} />
            </div>
            {order.comments ? <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{order.comments}</p> : null}
          </section>
          <section>
            <h2 className="mb-3 font-semibold text-ink">Lignes de commande</h2>
            <OrderItemsTable items={order.items} />
          </section>
          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 font-semibold text-ink">Totaux</h2>
            <Row label="Total HT" value={formatCurrency(order.subtotalHt)} />
            <Row label="TVA" value={formatCurrency(order.totalVat)} />
            <Row label="Total TTC" value={formatCurrency(order.totalTtc)} strong />
          </section>
          <section>
            <h2 className="mb-3 font-semibold text-ink">Envoi email</h2>
            <EmailComposer prospectClientId={order.prospectClientId} orderId={order.id} />
          </section>
        </div>
        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 font-semibold text-ink">Documents lies</h2>
            <a href={`/api/orders/${order.id}/pdf`} className="block rounded-md border border-line p-3 text-sm text-leaf hover:bg-slate-50">
              Generer le bon PDF
            </a>
          </section>
          <section className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 font-semibold text-ink">Historique d&apos;envoi</h2>
            <div className="space-y-3">
              {orderEmails.map((email) => (
                <div key={email.id} className="rounded-md border border-line p-3 text-sm">
                  <p className="font-medium">{email.subject}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(email.sentAt)} - {email.attachments.length} piece(s)
                  </p>
                </div>
              ))}
              {!orderEmails.length ? <p className="text-sm text-slate-500">Aucun email envoye pour cette commande.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function Info({ label, value, href }: { label: string; value?: string; href?: string }) {
  const content = <p className="mt-1 text-sm font-medium text-slate-800">{value || "-"}</p>;
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      {href ? (
        <Link href={href} className="hover:text-leaf">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-line py-2 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-semibold text-ink" : "font-medium"}>{value}</span>
    </div>
  );
}
