import { NextResponse } from "next/server";
import { calculateOrderLineTotal, calculateVat } from "@/lib/utils";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient, createServerSupabaseClient } from "@/supabase/admin";

type CreateOrderBody = {
  clientId?: string;
  comments?: string;
  lines?: {
    productId: string;
    quantity: number;
  }[];
};

type DbRow = Record<string, unknown>;

function mapOrder(row: DbRow) {
  const prospectClient = row.prospects_clients as DbRow | undefined;
  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    orderNumber: String(row.order_number ?? ""),
    prospectClientId: String(row.prospect_client_id ?? ""),
    clientName: prospectClient ? String(prospectClient.trade_name ?? prospectClient.company_name ?? "") : "",
    orderStatus: String(row.order_status ?? ""),
    orderDate: String(row.order_date ?? ""),
    deliveryAddressLine1: String(row.delivery_address_line_1 ?? ""),
    deliveryPostalCode: String(row.delivery_postal_code ?? ""),
    deliveryCity: String(row.delivery_city ?? ""),
    deliveryCountry: String(row.delivery_country ?? "France"),
    comments: String(row.comments ?? ""),
    subtotalHt: Number(row.subtotal_ht ?? 0),
    totalVat: Number(row.total_vat ?? 0),
    totalTtc: Number(row.total_ttc ?? 0),
    estimatedCommissionAmount: Number(row.estimated_commission_amount ?? 0),
    commissionRate: Number(row.commission_rate ?? 20),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    items: []
  };
}

export async function GET() {
  const { user, response } = await requireAuthenticatedUser();
  if (response || !user) return response;

  const supabase = createAdminClient();
  const { data: orderRows, error } = await supabase
    .from("orders")
    .select("*, prospects_clients(company_name,trade_name)")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: (orderRows ?? []).map((row) => mapOrder(row as DbRow)) });
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const body = (await request.json().catch(() => null)) as CreateOrderBody | null;

    if (!body?.clientId || !body.lines?.length) {
      return NextResponse.json({ ok: false, error: "Client et lignes de commande requis." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: client, error: clientError } = await supabase
      .from("prospects_clients")
      .select("id,owner_user_id,address_line_1,postal_code,city,country,record_type")
      .eq("id", body.clientId)
      .eq("owner_user_id", user.id)
      .eq("record_type", "client")
      .single();

    if (clientError || !client) {
      return NextResponse.json({ ok: false, error: "Client introuvable ou non valide." }, { status: 404 });
    }

    const productIds = body.lines.map((line) => line.productId);
    const [{ data: products, error: productsError }, { data: priceItems, error: pricesError }] = await Promise.all([
      supabase
        .from("products")
        .select("id,reference,nom_produit,tarif_ht,tva")
        .in("id", productIds),
      supabase
        .from("price_list_items")
        .select("product_id,unit_price_ht,discount_percent")
        .in("product_id", productIds)
    ]);

    const loadError = productsError ?? pricesError;
    if (loadError) {
      return NextResponse.json({ ok: false, error: loadError.message }, { status: 500 });
    }

    const orderItems = body.lines.map((line, index) => {
      const product = products?.find((item) => item.id === line.productId);
      if (!product) {
        throw new Error(`Produit introuvable: ${line.productId}`);
      }
      const price = priceItems?.find((item) => item.product_id === line.productId);
      const unitPrice = Number(price?.unit_price_ht ?? product.tarif_ht ?? 0);
      const discount = Number(price?.discount_percent ?? 0);
      const quantity = Math.max(Number(line.quantity || 1), 1);
      const totalLine = calculateOrderLineTotal(quantity, unitPrice, discount);

      return {
        product_id: product.id,
        product_reference: product.reference,
        product_name: product.nom_produit,
        quantity,
        unit_price_ht: unitPrice,
        discount_percent: discount,
        vat_rate: Number(product.tva ?? 20),
        line_total_ht: totalLine,
        sort_order: index + 1
      };
    });

    const totalHt = orderItems.reduce((sum, item) => sum + item.line_total_ht, 0);
    const totalTva = orderItems.reduce((sum, item) => sum + calculateVat(item.line_total_ht, item.vat_rate), 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        owner_user_id: user.id,
        prospect_client_id: client.id,
        order_status: "brouillon",
        order_date: new Date().toISOString().slice(0, 10),
        delivery_address_line_1: client.address_line_1 ?? null,
        delivery_postal_code: client.postal_code ?? null,
        delivery_city: client.city ?? null,
        delivery_country: client.country ?? "France",
        comments: body.comments ?? null,
        subtotal_ht: totalHt,
        total_vat: totalTva,
        total_ttc: totalHt + totalTva,
        estimated_commission_amount: totalHt * 0.2,
        commission_rate: 20
      })
      .select("id,order_number")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ ok: false, error: orderError?.message ?? "Creation commande impossible." }, { status: 500 });
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      orderItems.map((item) => ({
        ...item,
        owner_user_id: user.id,
        order_id: order.id
      }))
    );

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id).eq("owner_user_id", user.id);
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.order_number });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Creation commande impossible."
      },
      { status: 500 }
    );
  }
}
