import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/supabase/server";
import type { ProspectClient } from "@/types/crm";

function mapProspectClient(row: Record<string, unknown>): ProspectClient {
  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    recordType: row.record_type === "client" ? "client" : "prospect",
    companyName: String(row.company_name ?? ""),
    tradeName: String(row.trade_name ?? row.company_name ?? ""),
    clientType:
      row.client_type === "collectivite" || row.client_type === "commerce_de_bouche" || row.client_type === "autre"
        ? row.client_type
        : "CHR",
    commercialStatus:
      row.commercial_status === "en_cours" ||
      row.commercial_status === "relance" ||
      row.commercial_status === "gagne" ||
      row.commercial_status === "perdu" ||
      row.commercial_status === "actif" ||
      row.commercial_status === "inactif"
        ? row.commercial_status
        : "a_prospecter",
    siret: String(row.siret ?? ""),
    vatNumber: row.vat_number ? String(row.vat_number) : undefined,
    contactFirstName: String(row.contact_first_name ?? ""),
    contactLastName: String(row.contact_last_name ?? ""),
    contactJobTitle: String(row.contact_job_title ?? ""),
    phone: String(row.phone ?? ""),
    mobile: String(row.mobile ?? ""),
    email: String(row.email ?? ""),
    addressLine1: String(row.address_line_1 ?? ""),
    addressLine2: row.address_line_2 ? String(row.address_line_2) : undefined,
    postalCode: String(row.postal_code ?? ""),
    city: String(row.city ?? ""),
    country: String(row.country ?? "France"),
    geographicSector: String(row.geographic_sector ?? ""),
    notes: String(row.notes ?? ""),
    source: String(row.source ?? ""),
    lastInteractionAt: row.last_interaction_at ? String(row.last_interaction_at) : undefined,
    nextFollowUpAt: row.next_follow_up_at ? String(row.next_follow_up_at) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

export default async function CrmPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects_clients")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Chargement CRM impossible: ${error.message}`);
  }

  const rows = (data ?? []).map((row) => mapProspectClient(row as Record<string, unknown>));
  const cityOptions = Array.from(new Set(rows.map((row) => row.city).filter(Boolean))).map((city) => ({ label: city, value: city }));

  return (
    <>
      <PageHeader
        title="CRM"
        description="Prospects et clients dans une seule base commerciale, avec recherche, filtres et transformation."
        actions={
          <>
            <Link href="/crm/new?type=prospect" className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              Nouveau prospect
            </Link>
            <Link href="/crm/new?type=client" className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
              <Plus className="h-4 w-4" />
              Nouveau client
            </Link>
          </>
        }
      />
      <DataTable<ProspectClient>
        rows={rows}
        searchPlaceholder="Rechercher société, enseigne, ville, contact..."
        searchKeys={[(row) => row.companyName, (row) => row.tradeName, (row) => row.email, (row) => row.city, (row) => row.contactLastName]}
        filters={[
          { key: "recordType", label: "Type fiche", value: "", options: [{ label: "Prospect", value: "prospect" }, { label: "Client", value: "client" }] },
          { key: "commercialStatus", label: "Statut", value: "", options: [{ label: "A prospecter", value: "a_prospecter" }, { label: "En cours", value: "en_cours" }, { label: "Relance", value: "relance" }, { label: "Actif", value: "actif" }, { label: "Perdu", value: "perdu" }] },
          { key: "clientType", label: "Type client", value: "", options: [{ label: "CHR", value: "CHR" }, { label: "Collectivite", value: "collectivite" }, { label: "Commerce de bouche", value: "commerce_de_bouche" }] },
          { key: "city", label: "Ville", value: "", options: cityOptions }
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
