import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/supabase/server";
import { formatDate } from "@/lib/utils";
import type { CommercialAction } from "@/types/crm";

type DbRow = Record<string, unknown>;

function mapAction(row: DbRow): CommercialAction {
  const actionType = String(row.action_type ?? row.type ?? "appel");
  const actionStatus = String(row.statut ?? "a_faire");

  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    prospectClientId: String(row.prospect_client_id ?? ""),
    actionType:
      actionType === "visite" || actionType === "relance" || actionType === "email" || actionType === "rendez_vous" || actionType === "note"
        ? actionType
        : "appel",
    actionStatus: actionStatus === "fait" || actionStatus === "annule" ? actionStatus : "a_faire",
    actionDate: String(row.date_action ?? row.created_at ?? ""),
    summary: String(row.compte_rendu ?? ""),
    details: row.prochaine_action ? String(row.prochaine_action) : undefined,
    nextActionType: undefined,
    nextActionDate: row.date_prochaine_action ? String(row.date_prochaine_action) : undefined,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

export default async function ActionsPage() {
  const supabase = await createClient();
  const [{ data: actionsRows, error: actionsError }, { data: prospectRows, error: prospectsError }] = await Promise.all([
    supabase.from("commercial_actions").select("*").order("date_action", { ascending: false }),
    supabase.from("prospects_clients").select("id,trade_name,company_name")
  ]);

  const loadError = actionsError ?? prospectsError;
  if (loadError) {
    throw new Error(`Chargement actions impossible: ${loadError.message}`);
  }

  const actions = ((actionsRows ?? []) as DbRow[]).map(mapAction);
  const nameByProspectId = new Map<string, string>();
  for (const row of (prospectRows ?? []) as DbRow[]) {
    const id = String(row.id ?? "");
    const name = String(row.trade_name ?? row.company_name ?? "");
    if (id) nameByProspectId.set(id, name);
  }

  return (
    <>
      <PageHeader title="Actions commerciales" description="Relances, visites, appels et notes de suivi chronologiques." />
      <DataTable<CommercialAction>
        rows={actions}
        searchPlaceholder="Rechercher action, client, resume..."
        searchKeys={[(row) => row.summary, (row) => row.details, (row) => nameByProspectId.get(row.prospectClientId)]}
        filters={[
          { key: "actionType", label: "Type", value: "", options: [{ label: "Appel", value: "appel" }, { label: "Visite", value: "visite" }, { label: "Relance", value: "relance" }, { label: "Email", value: "email" }] },
          { key: "actionStatus", label: "Statut", value: "", options: [{ label: "A faire", value: "a_faire" }, { label: "Fait", value: "fait" }, { label: "Annule", value: "annule" }] }
        ]}
        columns={[
          { key: "actionDate", header: "Date", sortable: true, render: (row) => formatDate(row.actionDate) },
          { key: "prospectClientId", header: "Societe", render: (row) => nameByProspectId.get(row.prospectClientId) ?? "-" },
          { key: "actionType", header: "Type", sortable: true },
          { key: "summary", header: "Resume" },
          { key: "nextActionDate", header: "Prochaine", sortable: true, render: (row) => formatDate(row.nextActionDate) },
          { key: "actionStatus", header: "Statut", render: (row) => <StatusBadge status={row.actionStatus} /> }
        ]}
      />
    </>
  );
}
