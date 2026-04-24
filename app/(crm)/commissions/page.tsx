import { WalletCards } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Commission } from "@/types/crm";

type DbRow = Record<string, unknown>;

function readField(row: DbRow, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function mapCommission(orderRow: DbRow): Commission {
  const subtotalHt = Number(readField(orderRow, "subtotal_ht", "total_ht") ?? 0);
  const commissionRate = Number(orderRow.commission_rate ?? 20);
  const estimatedCommission = Number(readField(orderRow, "estimated_commission_amount", "commission_estimee") ?? subtotalHt * (commissionRate / 100));
  const orderStatus = String(readField(orderRow, "order_status", "statut") ?? "brouillon");
  const commissionStatus = orderStatus === "payee" ? "payee" : orderStatus === "validee" || orderStatus === "livree" ? "due" : "a_venir";

  return {
    id: `com-${String(orderRow.id ?? "")}`,
    ownerUserId: String(orderRow.owner_user_id ?? ""),
    orderId: String(orderRow.id ?? ""),
    prospectClientId: String(readField(orderRow, "prospect_client_id", "client_id") ?? ""),
    commissionBaseHt: subtotalHt,
    commissionRate,
    commissionAmount: estimatedCommission,
    commissionStatus,
    calculatedAt: String(readField(orderRow, "order_date", "date_commande", "created_at") ?? ""),
    paidAt: orderStatus === "payee" ? String(readField(orderRow, "updated_at", "created_at") ?? "") : undefined,
    createdAt: String(orderRow.created_at ?? ""),
    updatedAt: String(orderRow.updated_at ?? "")
  };
}

export default async function CommissionsPage() {
  const supabase = await createClient();
  const [{ data: orderRows, error: ordersError }, { data: prospectRows, error: prospectsError }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("prospects_clients").select("id,trade_name,company_name")
  ]);

  const loadError = ordersError ?? prospectsError;
  if (loadError) {
    throw new Error(`Chargement commissions impossible: ${loadError.message}`);
  }

  const commissions = ((orderRows ?? []) as DbRow[]).map(mapCommission);
  const orderNumberById = new Map<string, string>();
  for (const row of (orderRows ?? []) as DbRow[]) {
    orderNumberById.set(String(row.id ?? ""), String(readField(row, "order_number", "numero_commande") ?? ""));
  }

  const clientNameById = new Map<string, string>();
  for (const row of (prospectRows ?? []) as DbRow[]) {
    clientNameById.set(String(row.id ?? ""), String(row.trade_name ?? row.company_name ?? ""));
  }

  const total = commissions.reduce((sum, item) => sum + item.commissionAmount, 0);
  const due = commissions.filter((item) => item.commissionStatus === "due").reduce((sum, item) => sum + item.commissionAmount, 0);

  return (
    <>
      <PageHeader title="Commissions" description="Suivi estime, du et paye par commande." />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <KpiCard label="Total estime" value={formatCurrency(total)} icon={WalletCards} />
        <KpiCard label="Due" value={formatCurrency(due)} icon={WalletCards} tone="amber" />
        <KpiCard label="Taux par defaut" value="20%" icon={WalletCards} tone="green" />
      </div>
      <DataTable<Commission>
        rows={commissions}
        searchPlaceholder="Rechercher commission, client, commande..."
        searchKeys={[(row) => orderNumberById.get(row.orderId), (row) => clientNameById.get(row.prospectClientId ?? "")]}
        filters={[
          { key: "commissionStatus", label: "Statut", value: "", options: [{ label: "A venir", value: "a_venir" }, { label: "Due", value: "due" }, { label: "Payee", value: "payee" }] }
        ]}
        columns={[
          { key: "orderId", header: "Commande", render: (row) => orderNumberById.get(row.orderId) ?? "-" },
          { key: "prospectClientId", header: "Client", render: (row) => clientNameById.get(row.prospectClientId ?? "") ?? "-" },
          { key: "commissionBaseHt", header: "Base HT", sortable: true, accessor: (row) => row.commissionBaseHt, render: (row) => formatCurrency(row.commissionBaseHt) },
          { key: "commissionRate", header: "Taux", sortable: true, render: (row) => `${row.commissionRate}%` },
          { key: "commissionAmount", header: "Montant", sortable: true, accessor: (row) => row.commissionAmount, render: (row) => formatCurrency(row.commissionAmount) },
          { key: "commissionStatus", header: "Statut", render: (row) => <StatusBadge status={row.commissionStatus} /> },
          { key: "calculatedAt", header: "Calcul", sortable: true, render: (row) => formatDate(row.calculatedAt) }
        ]}
      />
    </>
  );
}
