import Link from "next/link";
import { Plus } from "lucide-react";
import { CrmTable } from "@/app/(crm)/crm/crm-table";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/supabase/server";
import type { ProspectClient } from "@/types/crm";

type QueryResult = { data: Record<string, unknown>[] | null; error: { message: string } | null };

function isMissingRelation(message: string, relation: string) {
  return message.includes(`relation "${relation}" does not exist`) || message.includes(`Could not find the table '${relation}'`);
}

function isMissingColumn(message: string, column: string) {
  return message.includes(`column "${column}" does not exist`) || message.includes(`Could not find the '${column}' column`);
}

function mapProspectClient(row: Record<string, unknown>): ProspectClient {
  const companyName = String(row.company_name ?? row.name ?? "");
  const tradeName = String(row.trade_name ?? row.tradeName ?? row.name ?? companyName);
  const contactFirstName = String(row.contact_first_name ?? row.first_name ?? "");
  const contactLastName = String(row.contact_last_name ?? row.last_name ?? "");

  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? row.owner_id ?? ""),
    recordType: row.record_type === "client" || row.type === "client" ? "client" : "prospect",
    companyName,
    tradeName,
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
    contactFirstName,
    contactLastName,
    contactJobTitle: String(row.contact_job_title ?? row.job_title ?? ""),
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

async function fetchCrmRows(supabase: Awaited<ReturnType<typeof createClient>>): Promise<QueryResult> {
  const primary = await supabase.from("prospects_clients").select("*").order("updated_at", { ascending: false });
  if (!primary.error) {
    return { data: (primary.data ?? []) as Record<string, unknown>[], error: null };
  }

  if (isMissingColumn(primary.error.message, "updated_at")) {
    const noSort = await supabase.from("prospects_clients").select("*").order("created_at", { ascending: false });
    if (!noSort.error) {
      return { data: (noSort.data ?? []) as Record<string, unknown>[], error: null };
    }
  }

  if (!isMissingRelation(primary.error.message, "prospects_clients")) {
    return { data: null, error: { message: primary.error.message } };
  }

  const legacy = await supabase.from("clients").select("*").order("updated_at", { ascending: false });
  if (!legacy.error) {
    return { data: (legacy.data ?? []) as Record<string, unknown>[], error: null };
  }

  if (isMissingColumn(legacy.error.message, "updated_at")) {
    const legacyNoSort = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (!legacyNoSort.error) {
      return { data: (legacyNoSort.data ?? []) as Record<string, unknown>[], error: null };
    }
  }

  return {
    data: null,
    error: { message: `${primary.error.message} | fallback clients: ${legacy.error.message}` }
  };
}

export default async function CrmPage() {
  const supabase = await createClient();
  const { data, error } = await fetchCrmRows(supabase);

  if (error) {
    throw new Error(`Chargement CRM impossible: ${error.message}`);
  }

  const rows = (data ?? []).map((row) => mapProspectClient(row));
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
      <CrmTable rows={rows} cityOptions={cityOptions} />
    </>
  );
}
