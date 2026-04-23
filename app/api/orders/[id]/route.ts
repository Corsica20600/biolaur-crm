import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

type DbRow = Record<string, unknown>;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, response } = await requireAuthenticatedUser();
  if (response || !user) return response;

  const supabase = createAdminClient();

  const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, prospects_clients(company_name,trade_name)")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .single(),
    supabase.from("order_items").select("*").eq("order_id", id).eq("owner_user_id", user.id).order("sort_order")
  ]);

  const error = orderError ?? itemsError;
  if (error || !order) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Commande introuvable." }, { status: 404 });
  }

  const client = order.prospects_clients as DbRow | null;

  return NextResponse.json({
    ok: true,
    order: {
      id: String(order.id ?? ""),
      ownerUserId: String(order.owner_user_id ?? ""),
      orderNumber: String(order.order_number ?? ""),
      prospectClientId: String(order.prospect_client_id ?? ""),
      clientName: client ? String(client.trade_name ?? client.company_name ?? "") : "",
      orderStatus: String(order.order_status ?? ""),
      orderDate: String(order.order_date ?? ""),
      deliveryAddressLine1: String(order.delivery_address_line_1 ?? ""),
      deliveryPostalCode: String(order.delivery_postal_code ?? ""),
      deliveryCity: String(order.delivery_city ?? ""),
      deliveryCountry: String(order.delivery_country ?? "France"),
      comments: order.comments ? String(order.comments) : "",
      subtotalHt: Number(order.subtotal_ht ?? 0),
      totalVat: Number(order.total_vat ?? 0),
      totalTtc: Number(order.total_ttc ?? 0),
      estimatedCommissionAmount: Number(order.estimated_commission_amount ?? 0),
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
