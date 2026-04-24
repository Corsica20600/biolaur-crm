"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { CommercialAction } from "@/types/crm";

type ActionRow = CommercialAction & { clientName?: string };

export default function ActionsPage() {
  const [rows, setRows] = useState<ActionRow[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/actions", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json().catch(() => null)) as { ok: boolean; actions?: ActionRow[] } | null;
      if (payload?.ok) {
        setRows(payload.actions ?? []);
      }
    }

    load();
  }, []);

  return (
    <>
      <PageHeader title="Actions commerciales" description="Relances, visites, appels et notes de suivi chronologiques." />
      <DataTable<ActionRow>
        rows={rows}
        searchPlaceholder="Rechercher action, client, resume..."
        searchKeys={[(row) => row.summary, (row) => row.details, (row) => row.clientName]}
        filters={[
          { key: "actionType", label: "Type", value: "", options: [{ label: "Appel", value: "appel" }, { label: "Visite", value: "visite" }, { label: "Relance", value: "relance" }, { label: "Email", value: "email" }] },
          { key: "actionStatus", label: "Statut", value: "", options: [{ label: "A faire", value: "a_faire" }, { label: "Fait", value: "fait" }, { label: "Annule", value: "annule" }] }
        ]}
        columns={[
          { key: "actionDate", header: "Date", sortable: true, render: (row) => formatDate(row.actionDate) },
          { key: "clientName", header: "Societe", render: (row) => row.clientName ?? "-" },
          { key: "actionType", header: "Type", sortable: true },
          { key: "summary", header: "Resume" },
          { key: "nextActionDate", header: "Prochaine", sortable: true, render: (row) => formatDate(row.nextActionDate) },
          { key: "actionStatus", header: "Statut", render: (row) => <StatusBadge status={row.actionStatus} /> }
        ]}
      />
    </>
  );
}
