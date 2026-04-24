import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

function readField(row: DbRow, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function mapCommission(orderRow: DbRow, clientName: string) {
  const subtotalHt = Number(readField(orderRow, "subtotal_ht", "total_ht") ?? 0);
  const commissionRate = Number(orderRow.commission_rate ?? 20);
  const estimatedCommission = Number(readField(orderRow, "estimated_commission_amount", "commission_estimee") ?? subtotalHt * (commissionRate / 100));
  const orderStatus = String(readField(orderRow, "order_status", "statut") ?? "brouillon");
  const commissionStatus = orderStatus === "payee" ? "payee" : orderStatus === "validee" || orderStatus === "livree" ? "due" : "a_venir";

  return {
    id: `com-${String(orderRow.id ?? "")}`,
    ownerUserId: String(orderRow.owner_user_id ?? orderRow.owner_id ?? ""),
    orderId: String(orderRow.id ?? ""),
    orderNumber: String(readField(orderRow, "order_number", "numero_commande") ?? ""),
    clientName,
    prospectClientId: String(readField(orderRow, "prospect_client_id", "client_id") ?? ""),
    commissionBaseHt: subtotalHt,
    commissionRate,
    commissionAmount: estimatedCommission,
    commissionStatus,
    calculatedAt: String(readField(orderRow, "order_date", "date_commande", "created_at") ?? ""),
    paidAt: orderStatus === "payee" ? String(readField(orderRow, "updated_at", "created_at") ?? "") : "",
    createdAt: String(orderRow.created_at ?? ""),
    updatedAt: String(orderRow.updated_at ?? "")
  };
}

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const supabase = createAdminClient();
    const byOwnerUserId = await supabase.from("orders").select("*").eq("owner_user_id", user.id).order("created_at", { ascending: false });
    const ordersResult =
      byOwnerUserId.error && byOwnerUserId.error.message.toLowerCase().includes("owner_user_id")
        ? await supabase.from("orders").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
        : byOwnerUserId;

    if (ordersResult.error) {
      return NextResponse.json({ ok: false, error: ordersResult.error.message }, { status: 500 });
    }

    const orders = (ordersResult.data ?? []) as DbRow[];
    const prospectIds = Array.from(new Set(orders.map((row) => String(readField(row, "prospect_client_id", "client_id") ?? "")).filter(Boolean)));
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
      commissions: orders.map((row) => {
        const prospectId = String(readField(row, "prospect_client_id", "client_id") ?? "");
        return mapCommission(row, nameById.get(prospectId) ?? "-");
      })
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Chargement commissions impossible." }, { status: 500 });
  }
}
