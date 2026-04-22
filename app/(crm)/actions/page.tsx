"use client";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { commercialActions, prospectsClients } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import type { CommercialAction } from "@/types/crm";

export default function ActionsPage() {
  return (
    <>
      <PageHeader title="Actions commerciales" description="Relances, visites, appels et notes de suivi chronologiques." />
      <DataTable<CommercialAction>
        rows={commercialActions}
        searchPlaceholder="Rechercher action, client, resume..."
        searchKeys={[(row) => row.summary, (row) => row.details, (row) => prospectsClients.find((record) => record.id === row.prospectClientId)?.tradeName]}
        filters={[
          { key: "actionType", label: "Type", value: "", options: [{ label: "Appel", value: "appel" }, { label: "Visite", value: "visite" }, { label: "Relance", value: "relance" }, { label: "Email", value: "email" }] },
          { key: "actionStatus", label: "Statut", value: "", options: [{ label: "A faire", value: "a_faire" }, { label: "Fait", value: "fait" }, { label: "Annule", value: "annule" }] }
        ]}
        columns={[
          { key: "actionDate", header: "Date", sortable: true, render: (row) => formatDate(row.actionDate) },
          { key: "prospectClientId", header: "Societe", render: (row) => prospectsClients.find((record) => record.id === row.prospectClientId)?.tradeName },
          { key: "actionType", header: "Type", sortable: true },
          { key: "summary", header: "Resume" },
          { key: "nextActionDate", header: "Prochaine", sortable: true, render: (row) => formatDate(row.nextActionDate) },
          { key: "actionStatus", header: "Statut", render: (row) => <StatusBadge status={row.actionStatus} /> }
        ]}
      />
    </>
  );
}
