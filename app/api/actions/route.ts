import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

function mapAction(row: DbRow, clientName: string) {
  const actionType = String(row.action_type ?? row.type ?? "appel");
  const actionStatus = String(row.statut ?? "a_faire");

  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? row.owner_id ?? ""),
    prospectClientId: String(row.prospect_client_id ?? ""),
    clientName,
    actionType:
      actionType === "visite" || actionType === "relance" || actionType === "email" || actionType === "rendez_vous" || actionType === "note"
        ? actionType
        : "appel",
    actionStatus: actionStatus === "fait" || actionStatus === "annule" ? actionStatus : "a_faire",
    actionDate: String(row.date_action ?? row.created_at ?? ""),
    summary: String(row.compte_rendu ?? ""),
    details: row.prochaine_action ? String(row.prochaine_action) : "",
    nextActionDate: row.date_prochaine_action ? String(row.date_prochaine_action) : "",
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const supabase = createAdminClient();
    const byOwnerUserId = await supabase
      .from("commercial_actions")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("date_action", { ascending: false });

    const actionsResult =
      byOwnerUserId.error && byOwnerUserId.error.message.toLowerCase().includes("owner_user_id")
        ? await supabase.from("commercial_actions").select("*").eq("owner_id", user.id).order("date_action", { ascending: false })
        : byOwnerUserId;

    if (actionsResult.error) {
      return NextResponse.json({ ok: false, error: actionsResult.error.message }, { status: 500 });
    }

    const actions = (actionsResult.data ?? []) as DbRow[];
    const prospectIds = Array.from(new Set(actions.map((row) => String(row.prospect_client_id ?? "")).filter(Boolean)));
    const { data: prospectsRows, error: prospectsError } = prospectIds.length
      ? await supabase.from("prospects_clients").select("id,trade_name,company_name").in("id", prospectIds)
      : { data: [], error: null };

    if (prospectsError) {
      return NextResponse.json({ ok: false, error: prospectsError.message }, { status: 500 });
    }

    const nameById = new Map<string, string>();
    for (const prospect of (prospectsRows ?? []) as DbRow[]) {
      nameById.set(String(prospect.id ?? ""), String(prospect.trade_name ?? prospect.company_name ?? "-"));
    }

    return NextResponse.json({
      ok: true,
      actions: actions.map((row) => mapAction(row, nameById.get(String(row.prospect_client_id ?? "")) ?? "-"))
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Chargement actions impossible." }, { status: 500 });
  }
}
