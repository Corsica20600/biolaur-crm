"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types/crm";

export default function OrdersPage() {
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadRemoteOrders() {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { ok: boolean; orders?: Order[] };
      if (payload.ok) setRemoteOrders(payload.orders ?? []);
    }

    loadRemoteOrders();
  }, []);

  return (
    <>
      <PageHeader
        title="Commandes"
        description="Suivi des brouillons, commandes envoyees, validees, livrees et payees."
        actions={
          <Link href="/orders/new" className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Link>
        }
      />
      <DataTable<Order>
        rows={remoteOrders}
        searchPlaceholder="Rechercher numero, client..."
        searchKeys={[(row) => row.orderNumber, (row) => row.clientName]}
        filters={[
          { key: "orderStatus", label: "Statut", value: "", options: [{ label: "Brouillon", value: "brouillon" }, { label: "Envoyee", value: "envoyee" }, { label: "Validee", value: "validee" }, { label: "Payee", value: "payee" }] }
        ]}
        columns={[
          { key: "orderNumber", header: "Commande", sortable: true, render: (row) => <Link href={`/orders/${row.id}`} className="font-medium text-ink hover:text-leaf">{row.orderNumber}</Link> },
          { key: "prospectClientId", header: "Client", render: (row) => row.clientName ?? "-" },
          { key: "orderDate", header: "Date", sortable: true, render: (row) => formatDate(row.orderDate) },
          { key: "orderStatus", header: "Statut", render: (row) => <StatusBadge status={row.orderStatus} /> },
          { key: "subtotalHt", header: "Total HT", sortable: true, accessor: (row) => row.subtotalHt, render: (row) => formatCurrency(row.subtotalHt) },
          { key: "estimatedCommissionAmount", header: "Commission", sortable: true, accessor: (row) => row.estimatedCommissionAmount, render: (row) => formatCurrency(row.estimatedCommissionAmount) }
        ]}
      />
    </>
  );
}
