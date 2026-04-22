import { NextResponse } from "next/server";
import { calculateOrderLineTotal, calculateVat } from "@/lib/utils";
import { createAdminClient, createServerSupabaseClient } from "@/supabase/admin";

type CreateOrderBody = {
  clientId?: string;
  comments?: string;
  lines?: {
    productId: string;
    quantity: number;
  }[];
};

function mapOrder(row: any, items: any[] = []) {
  return {
    id: row.id,
    ownerUserId: row.owner_id,
    orderNumber: row.numero_commande,
    prospectClientId: row.client_id,
    clientName: row.clients?.nom_commercial || row.clients?.raison_sociale,
    orderStatus: row.statut,
    orderDate: row.date_commande,
    deliveryAddressLine1: row.adresse_livraison ?? "",
    deliveryPostalCode: "",
    deliveryCity: "",
    deliveryCountry: "France",
    comments: row.commentaire ?? "",
    subtotalHt: Number(row.total_ht ?? 0),
    totalVat: Number(row.total_tva ?? 0),
    totalTtc: Number(row.total_ttc ?? 0),
    estimatedCommissionAmount: Number(row.commission_estimee ?? 0),
    commissionRate: 20,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
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
  };
}

export async function GET() {
  const supabase = createAdminClient();
  const { data: orderRows, error } = await supabase
    .from("orders")
    .select("*, clients(raison_sociale,nom_commercial)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: (orderRows ?? []).map((row) => mapOrder(row)) });
}

async function createOrderNumber(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("date_commande", `${year}-01-01`)
    .lte("date_commande", `${year}-12-31`);

  return `CMD-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as CreateOrderBody | null;

    if (!body?.clientId || !body.lines?.length) {
      return NextResponse.json({ ok: false, error: "Client et lignes de commande requis." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id,owner_id,adresse,code_postal,ville,pays,type_fiche")
      .eq("id", body.clientId)
      .eq("type_fiche", "client")
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
        .select("product_id,prix_ht,remise")
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
      const unitPrice = Number(price?.prix_ht ?? product.tarif_ht ?? 0);
      const discount = Number(price?.remise ?? 0);
      const quantity = Math.max(Number(line.quantity || 1), 1);
      const totalLine = calculateOrderLineTotal(quantity, unitPrice, discount);

      return {
        owner_id: client.owner_id,
        product_id: product.id,
        reference: product.reference,
        designation: product.nom_produit,
        quantite: quantity,
        prix_unitaire_ht: unitPrice,
        remise: discount,
        total_ligne_ht: totalLine,
        vatRate: Number(product.tva ?? 20),
        sort_order: index + 1
      };
    });

    const totalHt = orderItems.reduce((sum, item) => sum + item.total_ligne_ht, 0);
    const totalTva = orderItems.reduce((sum, item) => sum + calculateVat(item.total_ligne_ht, item.vatRate), 0);
    const orderNumber = await createOrderNumber(supabase);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        owner_id: client.owner_id,
        numero_commande: orderNumber,
        client_id: client.id,
        date_commande: new Date().toISOString().slice(0, 10),
        statut: "brouillon",
        adresse_livraison: [client.adresse, client.code_postal, client.ville].filter(Boolean).join(", "),
        commentaire: body.comments ?? null,
        total_ht: totalHt,
        total_tva: totalTva,
        total_ttc: totalHt + totalTva,
        commission_estimee: totalHt * 0.2
      })
      .select("id,numero_commande")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ ok: false, error: orderError?.message ?? "Creation commande impossible." }, { status: 500 });
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      orderItems.map(({ vatRate: _vatRate, sort_order: _sortOrder, ...item }) => ({
        ...item,
        order_id: order.id
      }))
    );

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.numero_commande });
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
