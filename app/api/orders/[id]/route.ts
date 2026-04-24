import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

function readOrderField(row: DbRow, canonical: string, legacy?: string) {
  if (row[canonical] !== undefined && row[canonical] !== null) return row[canonical];
  if (legacy && row[legacy] !== undefined && row[legacy] !== null) return row[legacy];
  return undefined;
}

async function findOrder(
  supabase: ReturnType<typeof createAdminClient>,
  ownerUserId: string,
  idOrNumber: string
) {
  const byId = await supabase
    .from("orders")
    .select("*")
    .eq("id", idOrNumber)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (!byId.error && byId.data) return { row: byId.data as DbRow, error: null as null };

  const byOrderNumber = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", idOrNumber)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (!byOrderNumber.error && byOrderNumber.data) return { row: byOrderNumber.data as DbRow, error: null as null };

  const byNumeroCommande = await supabase
    .from("orders")
    .select("*")
    .eq("numero_commande", idOrNumber)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (!byNumeroCommande.error && byNumeroCommande.data) return { row: byNumeroCommande.data as DbRow, error: null as null };

  return {
    row: null,
    error: byId.error ?? byOrderNumber.error ?? byNumeroCommande.error ?? { message: "Commande introuvable." }
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, response } = await requireAuthenticatedUser();
  if (response || !user) return response;

  const supabase = createAdminClient();

  const { row: order, error: orderError } = await findOrder(supabase, user.id, id);
  if (orderError || !order) {
    return NextResponse.json({ ok: false, error: orderError?.message ?? "Commande introuvable." }, { status: 404 });
  }

  const orderId = String(order.id ?? "");
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("owner_user_id", user.id)
    .order("sort_order");
  if (itemsError) {
    return NextResponse.json({ ok: false, error: itemsError.message }, { status: 500 });
  }

  const prospectClientId = String(readOrderField(order, "prospect_client_id", "client_id") ?? "");
  const { data: prospectClient, error: prospectClientError } = prospectClientId
    ? await supabase.from("prospects_clients").select("id,company_name,trade_name").eq("id", prospectClientId).single()
    : { data: null, error: null };

  if (prospectClientError) {
    return NextResponse.json({ ok: false, error: prospectClientError.message }, { status: 500 });
  }

  const client = (prospectClient ?? null) as DbRow | null;

  return NextResponse.json({
    ok: true,
    order: {
      id: String(order.id ?? ""),
      ownerUserId: String(order.owner_user_id ?? ""),
      orderNumber: String(readOrderField(order, "order_number", "numero_commande") ?? ""),
      prospectClientId,
      clientId: prospectClientId,
      clientName: client ? String(client.trade_name ?? client.company_name ?? "") : "",
      orderStatus: String(readOrderField(order, "order_status", "statut") ?? ""),
      orderDate: String(readOrderField(order, "order_date", "date_commande") ?? ""),
      deliveryAddressLine1: String(readOrderField(order, "delivery_address_line_1", "adresse_livraison") ?? ""),
      deliveryPostalCode: String(order.delivery_postal_code ?? ""),
      deliveryCity: String(order.delivery_city ?? ""),
      deliveryCountry: String(order.delivery_country ?? "France"),
      comments: String(readOrderField(order, "comments", "commentaire") ?? ""),
      subtotalHt: Number(readOrderField(order, "subtotal_ht", "total_ht") ?? 0),
      totalVat: Number(readOrderField(order, "total_vat", "total_tva") ?? 0),
      totalTtc: Number(order.total_ttc ?? 0),
      estimatedCommissionAmount: Number(readOrderField(order, "estimated_commission_amount", "commission_estimee") ?? 0),
      commissionRate: Number(order.commission_rate ?? 20),
      createdAt: String(order.created_at ?? ""),
      updatedAt: String(order.updated_at ?? ""),
      items: (items ?? []).map((item) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productReference: item.product_reference,
        productName: item.product_name,
        quantity: Number(item.quantity ?? 0),
        unitPriceHt: Number(item.unit_price_ht ?? 0),
        discountPercent: Number(item.discount_percent ?? 0),
        vatRate: Number(item.vat_rate ?? 20),
        lineTotalHt: Number(item.line_total_ht ?? 0),
        sortOrder: Number(item.sort_order ?? 0),
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    }
  });
}
