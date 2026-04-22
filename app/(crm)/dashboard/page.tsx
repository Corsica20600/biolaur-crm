import Link from "next/link";
import { ClipboardList, Euro, Package, Users, WalletCards } from "lucide-react";
import { NextActionWidget } from "@/components/actions/next-action-widget";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { orders, products, prospectsClients } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const prospects = prospectsClients.filter((record) => record.recordType === "prospect");
  const customers = prospectsClients.filter((record) => record.recordType === "client");
  const totalHt = orders.reduce((sum, order) => sum + order.subtotalHt, 0);
  const monthHt = orders.filter((order) => order.orderDate.startsWith("2026-04")).reduce((sum, order) => sum + order.subtotalHt, 0);
  const commissions = orders.reduce((sum, order) => sum + order.estimatedCommissionAmount, 0);
  const pending = orders.filter((order) => ["brouillon", "envoyee"].includes(order.orderStatus)).length;
  const validated = orders.filter((order) => ["validee", "livree", "payee"].includes(order.orderStatus)).length;

  return (
    <>
      <PageHeader title="Tableau de bord" description="Vue simple pour prioriser les relances, les commandes et le chiffre d'affaires." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Prospects" value={prospects.length} icon={Users} />
        <KpiCard label="Clients" value={customers.length} icon={Users} tone="green" />
        <KpiCard label="Commandes" value={orders.length} helper={`${pending} en attente, ${validated} validees`} icon={ClipboardList} />
        <KpiCard label="CA HT total" value={formatCurrency(totalHt)} helper={`${formatCurrency(monthHt)} ce mois`} icon={Euro} tone="green" />
        <KpiCard label="Commissions estimees" value={formatCurrency(commissions)} icon={WalletCards} tone="amber" />
        <KpiCard label="Produits actifs" value={products.filter((product) => product.isActive).length} icon={Package} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 font-semibold text-ink">Commandes recentes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-line">
                {orders.map((order) => {
                  const record = prospectsClients.find((item) => item.id === order.prospectClientId);
                  return (
                    <tr key={order.id}>
                      <td className="py-3 pr-4">
                        <Link href={`/orders/${order.id}`} className="font-medium text-ink hover:text-leaf">
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-slate-500">{record?.tradeName}</p>
                      </td>
                      <td className="py-3 pr-4">{formatDate(order.orderDate)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="py-3 text-right font-medium">{formatCurrency(order.subtotalHt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <NextActionWidget />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <TopList title="Top clients" items={customers.slice(0, 5).map((record) => ({ label: record.tradeName, value: record.city }))} />
        <TopList title="Top produits" items={products.slice(0, 5).map((product) => ({ label: product.name, value: product.reference }))} />
      </div>
    </>
  );
}

function TopList({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="mb-3 font-semibold text-ink">{title}</h2>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
