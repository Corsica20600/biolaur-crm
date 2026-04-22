import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, response } = await requireAuthenticatedUser();
  if (response || !user) return response;

  const supabase = createAdminClient();

  const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from("orders").select("*, clients(raison_sociale,nom_commercial)").eq("id", id).eq("owner_user_id", user.id).single(),
    supabase.from("order_items").select("*").eq("order_id", id).eq("owner_user_id", user.id).order("created_at")
  ]);

  const error = orderError ?? itemsError;
  if (error || !order) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Commande introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      ownerUserId: order.owner_user_id ?? order.owner_id,
      orderNumber: order.numero_commande,
      prospectClientId: order.client_id,
      clientName: order.clients?.nom_commercial || order.clients?.raison_sociale,
      orderStatus: order.statut,
      orderDate: order.date_commande,
      deliveryAddressLine1: order.adresse_livraison ?? "",
      deliveryPostalCode: "",
      deliveryCity: "",
      deliveryCountry: "France",
      comments: order.commentaire ?? "",
      subtotalHt: Number(order.total_ht ?? 0),
      totalVat: Number(order.total_tva ?? 0),
      totalTtc: Number(order.total_ttc ?? 0),
      estimatedCommissionAmount: Number(order.commission_estimee ?? 0),
      commissionRate: 20,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (items ?? []).map((item) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productReference: item.reference,
        productName: item.designation,
        quantity: Number(item.quantite ?? 0),
        unitPriceHt: Number(item.prix_unitaire_ht ?? 0),
        discountPercent: Number(item.remise ?? 0),
        vatRate: 20,
        lineTotalHt: Number(item.total_ligne_ht ?? 0),
        sortOrder: 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    }
  });
}
