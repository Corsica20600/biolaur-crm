import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

function readOrderField(row: DbRow, canonical: string, legacy?: string) {
  if (row[canonical] !== undefined && row[canonical] !== null) return row[canonical];
  if (legacy && row[legacy] !== undefined && row[legacy] !== null) return row[legacy];
  return undefined;
}

function readItemField(row: DbRow, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function isOwnedByUser(row: DbRow, userId: string) {
  const ownerUserId = readOrderField(row, "owner_user_id", "owner_id");
  if (!ownerUserId) {
    return true;
  }
  return String(ownerUserId) === userId;
}

async function findOrder(
  supabase: ReturnType<typeof createAdminClient>,
  ownerUserId: string,
  idOrNumber: string
) {
  let lastDbError: string | null = null;

  const byId = await supabase
    .from("orders")
    .select("*")
    .eq("id", idOrNumber)
    .maybeSingle();
  if (byId.error) {
    console.error("ORDER FETCH ERROR", { step: "by_id", idOrNumber, error: byId.error.message });
    lastDbError = byId.error.message;
  }
  if (!byId.error && byId.data) {
    const row = byId.data as DbRow;
    if (isOwnedByUser(row, ownerUserId)) return { row, dbError: null as string | null };
    return { row: null, dbError: null as string | null };
  }

  const byOrderNumber = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", idOrNumber)
    .maybeSingle();
  if (byOrderNumber.error) {
    console.error("ORDER FETCH ERROR", { step: "by_order_number", idOrNumber, error: byOrderNumber.error.message });
    lastDbError = byOrderNumber.error.message;
  }
  if (!byOrderNumber.error && byOrderNumber.data) {
    const row = byOrderNumber.data as DbRow;
    if (isOwnedByUser(row, ownerUserId)) return { row, dbError: null as string | null };
    return { row: null, dbError: null as string | null };
  }

  const byNumeroCommande = await supabase
    .from("orders")
    .select("*")
    .eq("numero_commande", idOrNumber)
    .maybeSingle();
  if (byNumeroCommande.error) {
    console.error("ORDER FETCH ERROR", {
      step: "by_numero_commande",
      idOrNumber,
      error: byNumeroCommande.error.message
    });
    lastDbError = byNumeroCommande.error.message;
  }
  if (!byNumeroCommande.error && byNumeroCommande.data) {
    const row = byNumeroCommande.data as DbRow;
    if (isOwnedByUser(row, ownerUserId)) return { row, dbError: null as string | null };
    return { row: null, dbError: null as string | null };
  }

  return {
    row: null,
    dbError: lastDbError
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const supabase = createAdminClient();

    const { row: order, dbError } = await findOrder(supabase, user.id, id);
    if (dbError) {
      return NextResponse.json({ ok: false, error: dbError }, { status: 500 });
    }
    if (!order) {
      console.warn("ORDER DETAIL NOT FOUND", { id, userId: user.id });
      return NextResponse.json({ ok: false, error: "Commande introuvable" }, { status: 404 });
    }

    const orderId = String(order.id ?? "");
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("sort_order");
    if (itemsError) {
      console.error("ORDER ITEMS FETCH ERROR", { orderId, error: itemsError.message });
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 500 });
    }

    const orderItems = (items ?? []) as DbRow[];
    const prospectClientId = String(readOrderField(order, "prospect_client_id", "client_id") ?? "");

    return NextResponse.json({
      ok: true,
      order: {
        id: String(order.id ?? ""),
        ownerUserId: String(order.owner_user_id ?? ""),
        orderNumber: String(readOrderField(order, "order_number", "numero_commande") ?? ""),
        prospectClientId,
        clientId: prospectClientId,
        clientName: "",
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
        items: orderItems.map((item) => ({
          id: String(item.id ?? ""),
          orderId: String(readItemField(item, "order_id") ?? ""),
          productId: String(readItemField(item, "product_id") ?? ""),
          productReference: String(readItemField(item, "product_reference", "reference") ?? ""),
          productName: String(readItemField(item, "product_name", "nom_produit", "designation") ?? "Produit"),
          quantity: Number(readItemField(item, "quantity", "quantite") ?? 0),
          unitPriceHt: Number(readItemField(item, "unit_price_ht", "prix_unitaire_ht", "prix_unitaire") ?? 0),
          discountPercent: Number(readItemField(item, "discount_percent", "remise_percent") ?? 0),
          vatRate: Number(readItemField(item, "vat_rate", "taux_tva") ?? 0),
          lineTotalHt: Number(readItemField(item, "line_total_ht", "total_ligne_ht", "sous_total") ?? 0),
          sortOrder: Number(readItemField(item, "sort_order") ?? 0),
          createdAt: String(readItemField(item, "created_at") ?? ""),
          updatedAt: String(readItemField(item, "updated_at") ?? "")
        }))
      }
    });
  } catch (error) {
    console.error("ORDER DETAIL API ERROR", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
