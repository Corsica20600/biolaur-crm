import Link from "next/link";
import { CalendarClock, ClipboardList, Euro, Package, Users, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ActionStatus, OrderStatus } from "@/types/crm";

type DbRow = Record<string, unknown>;

function toOrderStatus(value: unknown): OrderStatus {
  if (value === "envoyee" || value === "validee" || value === "livree" || value === "payee" || value === "annulee") {
    return value;
  }
  return "brouillon";
}

function toActionStatus(value: unknown): ActionStatus {
  if (value === "fait" || value === "annule") {
    return value;
  }
  return "a_faire";
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const monthStartIso = formatDateOnly(monthStart);
  const nextMonthStartIso = formatDateOnly(nextMonthStart);

  const [
    { count: prospectsCount, error: prospectsError },
    { count: clientsCount, error: clientsError },
    { count: ordersCount, error: ordersCountError },
    { data: orderMetricRows, error: orderMetricsError },
    { data: monthOrderRows, error: monthOrdersError },
    { count: activeProductsCount, error: activeProductsError },
    { data: recentOrderRows, error: recentOrdersError },
    { data: upcomingActionRows, error: upcomingActionsError },
    { data: topClientRows, error: topClientsError },
    { data: topProductRows, error: topProductsError }
  ] = await Promise.all([
    supabase.from("prospects_clients").select("*", { count: "exact", head: true }).eq("record_type", "prospect"),
    supabase.from("prospects_clients").select("*", { count: "exact", head: true }).eq("record_type", "client"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("subtotal_ht,estimated_commission_amount,commission_rate,order_status"),
    supabase.from("orders").select("subtotal_ht").gte("order_date", monthStartIso).lt("order_date", nextMonthStartIso),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("actif", true),
    supabase
      .from("orders")
      .select("id,order_number,order_date,order_status,subtotal_ht,prospect_client_id,prospects_clients(trade_name,company_name)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("commercial_actions")
      .select("id,prospect_client_id,statut,compte_rendu,date_prochaine_action,prospects_clients(trade_name,company_name)")
      .not("date_prochaine_action", "is", null)
      .order("date_prochaine_action", { ascending: true })
      .limit(5),
    supabase.from("prospects_clients").select("id,trade_name,company_name,city").eq("record_type", "client").order("updated_at", { ascending: false }).limit(5),
    supabase.from("products").select("id,nom_produit,reference").eq("actif", true).order("updated_at", { ascending: false }).limit(5)
  ]);

  const loadError =
    prospectsError ??
    clientsError ??
    ordersCountError ??
    orderMetricsError ??
    monthOrdersError ??
    activeProductsError ??
    recentOrdersError ??
    upcomingActionsError ??
    topClientsError ??
    topProductsError;

  if (loadError) {
    throw new Error(`Chargement dashboard impossible: ${loadError.message}`);
  }

  const orderMetrics = (orderMetricRows ?? []) as DbRow[];
  const totalHt = orderMetrics.reduce((sum, row) => sum + Number(row.subtotal_ht ?? 0), 0);
  const commissions = orderMetrics.reduce((sum, row) => {
    const estimated = Number(row.estimated_commission_amount ?? 0);
    if (estimated > 0) return sum + estimated;
    const subtotal = Number(row.subtotal_ht ?? 0);
    const rate = Number(row.commission_rate ?? 20);
    return sum + subtotal * (rate / 100);
  }, 0);
  const pending = orderMetrics.filter((row) => row.order_status === "brouillon" || row.order_status === "envoyee").length;
  const validated = orderMetrics.filter((row) => row.order_status === "validee" || row.order_status === "livree" || row.order_status === "payee").length;
  const monthHt = ((monthOrderRows ?? []) as DbRow[]).reduce((sum, row) => sum + Number(row.subtotal_ht ?? 0), 0);

  const recentOrders = (recentOrderRows ?? []) as DbRow[];
  const upcomingActions = (upcomingActionRows ?? []) as DbRow[];
  const topClients = ((topClientRows ?? []) as DbRow[]).map((row) => ({
    label: String(row.trade_name ?? row.company_name ?? "-"),
    value: String(row.city ?? "-")
  }));
  const topProducts = ((topProductRows ?? []) as DbRow[]).map((row) => ({
    label: String(row.nom_produit ?? "-"),
    value: String(row.reference ?? "-")
  }));

  return (
    <>
      <PageHeader title="Tableau de bord" description="Vue simple pour prioriser les relances, les commandes et le chiffre d'affaires." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Prospects" value={prospectsCount ?? 0} icon={Users} />
        <KpiCard label="Clients" value={clientsCount ?? 0} icon={Users} tone="green" />
        <KpiCard label="Commandes" value={ordersCount ?? 0} helper={`${pending} en attente, ${validated} validees`} icon={ClipboardList} />
        <KpiCard label="CA HT total" value={formatCurrency(totalHt)} helper={`${formatCurrency(monthHt)} ce mois`} icon={Euro} tone="green" />
        <KpiCard label="Commissions estimees" value={formatCurrency(commissions)} icon={WalletCards} tone="amber" />
        <KpiCard label="Produits actifs" value={activeProductsCount ?? 0} icon={Package} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 font-semibold text-ink">Commandes recentes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-line">
                {recentOrders.map((order) => {
                  const prospectClient = order.prospects_clients as DbRow | null;
                  return (
                    <tr key={String(order.id ?? "")}>
                      <td className="py-3 pr-4">
                        <Link href={`/orders/${String(order.id ?? "")}`} className="font-medium text-ink hover:text-leaf">
                          {String(order.order_number ?? "")}
                        </Link>
                        <p className="text-xs text-slate-500">{String(prospectClient?.trade_name ?? prospectClient?.company_name ?? "-")}</p>
                      </td>
                      <td className="py-3 pr-4">{formatDate(String(order.order_date ?? ""))}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={toOrderStatus(order.order_status)} />
                      </td>
                      <td className="py-3 text-right font-medium">{formatCurrency(Number(order.subtotal_ht ?? 0))}</td>
                    </tr>
                  );
                })}
                {!recentOrders.length ? (
                  <tr>
                    <td className="py-3 text-sm text-slate-500" colSpan={4}>
                      Aucune commande recente.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-leaf" />
            <h2 className="font-semibold text-ink">Prochaines relances</h2>
          </div>
          <div className="space-y-3">
            {upcomingActions.map((action) => {
              const prospectClient = action.prospects_clients as DbRow | null;
              const prospectClientId = String(action.prospect_client_id ?? "");
              return (
                <Link key={String(action.id ?? "")} href={`/crm/${prospectClientId}`} className="block rounded-md border border-line p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{String(prospectClient?.trade_name ?? prospectClient?.company_name ?? "-")}</p>
                    <StatusBadge status={toActionStatus(action.statut)} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{String(action.compte_rendu ?? "-")}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(String(action.date_prochaine_action ?? ""))}</p>
                </Link>
              );
            })}
            {!upcomingActions.length ? <p className="text-sm text-slate-500">Aucune relance planifiee.</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <TopList title="Top clients" items={topClients} />
        <TopList title="Top produits" items={topProducts} />
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
