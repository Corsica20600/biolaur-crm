"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { prospectsClients } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import type { ProspectClient } from "@/types/crm";

export default function CrmPage() {
  return (
    <>
      <PageHeader
        title="CRM"
        description="Prospects et clients dans une seule base commerciale, avec recherche, filtres et transformation."
        actions={
          <>
            <button className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              Nouveau prospect
            </button>
            <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
              <Plus className="h-4 w-4" />
              Nouveau client
            </button>
          </>
        }
      />
      <DataTable<ProspectClient>
        rows={prospectsClients}
        searchPlaceholder="Rechercher société, enseigne, ville, contact..."
        searchKeys={[(row) => row.companyName, (row) => row.tradeName, (row) => row.email, (row) => row.city, (row) => row.contactLastName]}
        filters={[
          { key: "recordType", label: "Type fiche", value: "", options: [{ label: "Prospect", value: "prospect" }, { label: "Client", value: "client" }] },
          { key: "commercialStatus", label: "Statut", value: "", options: [{ label: "A prospecter", value: "a_prospecter" }, { label: "En cours", value: "en_cours" }, { label: "Relance", value: "relance" }, { label: "Actif", value: "actif" }, { label: "Perdu", value: "perdu" }] },
          { key: "clientType", label: "Type client", value: "", options: [{ label: "CHR", value: "CHR" }, { label: "Collectivite", value: "collectivite" }, { label: "Commerce de bouche", value: "commerce_de_bouche" }] },
          { key: "city", label: "Ville", value: "", options: Array.from(new Set(prospectsClients.map((row) => row.city))).map((city) => ({ label: city, value: city })) }
        ]}
        columns={[
          {
            key: "companyName",
            header: "Societe",
            sortable: true,
            render: (row) => (
              <Link href={`/crm/${row.id}`} className="font-medium text-ink hover:text-leaf">
                {row.tradeName}
                <span className="block text-xs font-normal text-slate-500">{row.companyName}</span>
              </Link>
            )
          },
          { key: "recordType", header: "Type", render: (row) => <StatusBadge status={row.recordType} /> },
          { key: "clientType", header: "Clientele", sortable: true },
          { key: "city", header: "Ville", sortable: true },
          { key: "contactLastName", header: "Contact", render: (row) => `${row.contactFirstName} ${row.contactLastName}` },
          { key: "commercialStatus", header: "Statut", render: (row) => <StatusBadge status={row.commercialStatus} /> },
          { key: "nextFollowUpAt", header: "Relance", sortable: true, render: (row) => formatDate(row.nextFollowUpAt) },
          {
            key: "convert",
            header: "Action",
            render: (row) =>
              row.recordType === "prospect" ? (
                <button className="focus-ring rounded-md border border-line px-3 py-1.5 text-xs font-medium text-leaf">Transformer</button>
              ) : (
                <Link href="/orders/new" className="focus-ring rounded-md border border-line px-3 py-1.5 text-xs font-medium text-leaf">Commander</Link>
              )
          }
        ]}
      />
    </>
  );
}
