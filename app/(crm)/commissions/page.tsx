"use client";

import { WalletCards } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { commissions, orders, prospectsClients } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Commission } from "@/types/crm";

export default function CommissionsPage() {
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
        searchKeys={[(row) => orders.find((order) => order.id === row.orderId)?.orderNumber, (row) => prospectsClients.find((record) => record.id === row.prospectClientId)?.tradeName]}
        filters={[
          { key: "commissionStatus", label: "Statut", value: "", options: [{ label: "A venir", value: "a_venir" }, { label: "Due", value: "due" }, { label: "Payee", value: "payee" }] }
        ]}
        columns={[
          { key: "orderId", header: "Commande", render: (row) => orders.find((order) => order.id === row.orderId)?.orderNumber },
          { key: "prospectClientId", header: "Client", render: (row) => prospectsClients.find((record) => record.id === row.prospectClientId)?.tradeName },
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
