import { NextResponse } from "next/server";
import { calculateOrderLineTotal, calculateVat } from "@/lib/utils";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient, createServerSupabaseClient } from "@/supabase/admin";

type CreateOrderBody = {
  clientId?: string;
  prospectClientId?: string;
  comments?: string;
  lines?: {
    productId: string;
    quantity: number;
  }[];
};

type DbRow = Record<string, unknown>;

function extractMissingColumn(message: string) {
  const match =
    message.match(/Could not find the '([^']+)' column/i) ??
    message.match(/column ["']?([a-zA-Z0-9_]+)["']? .* does not exist/i);
  return match?.[1];
}

function extractNotNullColumn(message: string) {
  const match = message.match(/null value in column "([^"]+)"/i);
  return match?.[1];
}

function readOrderField(row: DbRow, canonical: string, legacy?: string) {
  if (row[canonical] !== undefined && row[canonical] !== null) return row[canonical];
  if (legacy && row[legacy] !== undefined && row[legacy] !== null) return row[legacy];
  return undefined;
}

function parseOrderSequence(value: unknown, year: number) {
  const text = String(value ?? "");
  const match = text.match(new RegExp(`^CMD-${year}-([0-9]+)$`));
  return match ? Number(match[1]) : 0;
}

async function generateOrderNumber(supabase: ReturnType<typeof createServerSupabaseClient>, ownerUserId: string, orderDate: string) {
  const year = Number(orderDate.slice(0, 4)) || new Date().getUTCFullYear();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const maxSequence = (data ?? []).reduce((max, row) => {
    const typedRow = row as DbRow;
    const candidate = Math.max(
      parseOrderSequence(readOrderField(typedRow, "order_number", "numero_commande"), year),
      parseOrderSequence(readOrderField(typedRow, "numero_commande", "order_number"), year)
    );
    return candidate > max ? candidate : max;
  }, 0);

  return `CMD-${year}-${String(maxSequence + 1).padStart(4, "0")}`;
}

async function insertOrderWithCompatPayload(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  payload: Record<string, unknown>
) {
  const workingPayload: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase.from("orders").insert(workingPayload).select("*").single();
    if (!error && data) {
      return { data: data as DbRow, error: null as null };
    }

    const message = error?.message ?? "Creation commande impossible.";
    const missingColumn = extractMissingColumn(message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn];
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: { message: "Creation commande impossible: compatibilite schema epuisee." } };
}

async function insertOrderItemsWithCompatPayload(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  payloads: Record<string, unknown>[]
) {
  const workingPayloads = payloads.map((payload) => ({ ...payload }));

  function hydrateNotNullColumn(payload: Record<string, unknown>, column: string) {
    if (payload[column] !== undefined && payload[column] !== null) return true;

    const aliasSourceByColumn: Record<string, string[]> = {
      designation: ["product_name", "nom_produit"],
      product_name: ["designation", "nom_produit"],
      nom_produit: ["product_name", "designation"],
      reference: ["product_reference"],
      product_reference: ["reference"],
      quantite: ["quantity"],
      quantity: ["quantite"],
      prix_unitaire: ["unit_price_ht", "prix_unitaire_ht"],
      prix_unitaire_ht: ["unit_price_ht", "prix_unitaire"],
      unit_price_ht: ["prix_unitaire_ht", "prix_unitaire"],
      taux_tva: ["vat_rate"],
      vat_rate: ["taux_tva"],
      total_ligne_ht: ["line_total_ht", "sous_total"],
      sous_total: ["line_total_ht", "total_ligne_ht"],
      line_total_ht: ["total_ligne_ht", "sous_total"],
      remise_percent: ["discount_percent", "remise"],
      discount_percent: ["remise_percent", "remise"],
      remise: ["discount_percent", "remise_percent"],
      ordre: ["sort_order"],
      sort_order: ["ordre"]
    };

    const sources = aliasSourceByColumn[column] ?? [];
    for (const source of sources) {
      if (payload[source] !== undefined && payload[source] !== null) {
        payload[column] = payload[source];
        return true;
      }
    }

    return false;
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await supabase.from("order_items").insert(workingPayloads);
    if (!error) {
      return { error: null as null };
    }

    const message = error.message ?? "Insertion lignes commande impossible.";
    const missingColumn = extractMissingColumn(message);
    if (missingColumn && workingPayloads.some((payload) => Object.prototype.hasOwnProperty.call(payload, missingColumn))) {
      for (const payload of workingPayloads) {
        if (Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
          delete payload[missingColumn];
        }
      }
      continue;
    }

    const notNullColumn = extractNotNullColumn(message);
    if (notNullColumn) {
      let hydratedAtLeastOne = false;
      for (const payload of workingPayloads) {
        hydratedAtLeastOne = hydrateNotNullColumn(payload, notNullColumn) || hydratedAtLeastOne;
      }
      if (hydratedAtLeastOne) {
        continue;
      }
    }

    return { error };
  }

  return { error: { message: "Insertion lignes commande impossible: compatibilite schema epuisee." } };
}

function mapOrder(row: DbRow, prospectClient?: DbRow) {
  const prospectClientId = String(readOrderField(row, "prospect_client_id", "client_id") ?? "");

  return {
    id: String(row.id ?? ""),
    ownerUserId: String(row.owner_user_id ?? ""),
    orderNumber: String(readOrderField(row, "order_number", "numero_commande") ?? ""),
    prospectClientId,
    clientName: prospectClient ? String(prospectClient.trade_name ?? prospectClient.company_name ?? "") : "",
    orderStatus: String(readOrderField(row, "order_status", "statut") ?? ""),
    orderDate: String(readOrderField(row, "order_date", "date_commande") ?? ""),
    deliveryAddressLine1: String(readOrderField(row, "delivery_address_line_1", "adresse_livraison") ?? ""),
    deliveryPostalCode: String(row.delivery_postal_code ?? ""),
    deliveryCity: String(row.delivery_city ?? ""),
    deliveryCountry: String(row.delivery_country ?? "France"),
    comments: String(readOrderField(row, "comments", "commentaire") ?? ""),
    subtotalHt: Number(readOrderField(row, "subtotal_ht", "total_ht") ?? 0),
    totalVat: Number(readOrderField(row, "total_vat", "total_tva") ?? 0),
    totalTtc: Number(row.total_ttc ?? 0),
    estimatedCommissionAmount: Number(readOrderField(row, "estimated_commission_amount", "commission_estimee") ?? 0),
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
  const { data: orderRows, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return NextResponse.json({ ok: false, error: ordersError.message }, { status: 500 });
  }

  const orders = (orderRows ?? []) as DbRow[];
  const prospectClientIds = Array.from(
    new Set(orders.map((row) => String(readOrderField(row, "prospect_client_id", "client_id") ?? "")).filter((id) => id.length > 0))
  );

  const { data: prospectClientRows, error: prospectClientsError } = prospectClientIds.length
    ? await supabase.from("prospects_clients").select("id,company_name,trade_name").in("id", prospectClientIds)
    : { data: [], error: null };

  if (prospectClientsError) {
    return NextResponse.json({ ok: false, error: prospectClientsError.message }, { status: 500 });
  }

  const prospectClientById = new Map<string, DbRow>();
  for (const prospectClient of (prospectClientRows ?? []) as DbRow[]) {
    prospectClientById.set(String(prospectClient.id ?? ""), prospectClient);
  }

  return NextResponse.json({
    ok: true,
    orders: orders.map((row) => {
      const prospectClientId = String(readOrderField(row, "prospect_client_id", "client_id") ?? "");
      return mapOrder(row, prospectClientById.get(prospectClientId));
    })
  });
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const body = (await request.json().catch(() => null)) as CreateOrderBody | null;

    const requestedProspectClientId = String(body?.prospectClientId ?? body?.clientId ?? "");

    if (!requestedProspectClientId || !body?.lines?.length) {
      return NextResponse.json({ ok: false, error: "Client et lignes de commande requis." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: client, error: clientError } = await supabase
      .from("prospects_clients")
      .select("id,owner_user_id,address_line_1,postal_code,city,country,record_type")
      .eq("id", requestedProspectClientId)
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

    const orderDate = new Date().toISOString().slice(0, 10);
    const generatedOrderNumber = await generateOrderNumber(supabase, user.id, orderDate);
    const orderPayload: Record<string, unknown> = {
      owner_user_id: user.id,
      owner_id: user.id,
      prospect_client_id: client.id,
      client_id: null,
      order_number: generatedOrderNumber,
      numero_commande: generatedOrderNumber,
      order_status: "brouillon",
      statut: "brouillon",
      order_date: orderDate,
      date_commande: orderDate,
      delivery_address_line_1: client.address_line_1 ?? null,
      adresse_livraison: client.address_line_1 ?? null,
      delivery_postal_code: client.postal_code ?? null,
      delivery_city: client.city ?? null,
      delivery_country: client.country ?? "France",
      comments: body.comments ?? null,
      commentaire: body.comments ?? null,
      subtotal_ht: totalHt,
      total_ht: totalHt,
      total_vat: totalTva,
      total_tva: totalTva,
      total_ttc: totalHt + totalTva,
      estimated_commission_amount: totalHt * 0.2,
      commission_estimee: totalHt * 0.2,
      commission_rate: 20
    };

    const { data: order, error: orderError } = await insertOrderWithCompatPayload(supabase, orderPayload);

    if (orderError || !order) {
      console.error("ORDER CREATE ERROR", {
        error: orderError?.message ?? "Unknown order insert error",
        userId: user.id,
        prospectClientId: client.id,
        orderPayload
      });
      return NextResponse.json({ ok: false, error: orderError?.message ?? "Creation commande impossible." }, { status: 500 });
    }

    const orderItemsPayload = orderItems.map((item) => ({
      owner_user_id: user.id,
      owner_id: user.id,
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      quantite: item.quantity,
      unit_price_ht: item.unit_price_ht,
      prix_unitaire_ht: item.unit_price_ht,
      prix_unitaire: item.unit_price_ht,
      vat_rate: item.vat_rate,
      taux_tva: item.vat_rate,
      line_total_ht: item.line_total_ht,
      total_ligne_ht: item.line_total_ht,
      sous_total: item.line_total_ht,
      discount_percent: item.discount_percent,
      remise_percent: item.discount_percent,
      product_name: item.product_name,
      nom_produit: item.product_name,
      designation: item.product_name,
      product_reference: item.product_reference,
      reference: item.product_reference,
      sort_order: item.sort_order,
      ordre: item.sort_order
    }));

    const { error: itemsError } = await insertOrderItemsWithCompatPayload(supabase, orderItemsPayload);

    if (itemsError) {
      console.error("ORDER ITEMS INSERT ERROR", {
        orderId: String(order.id ?? ""),
        itemsErrorMessage: itemsError.message ?? "Unknown order items insert error",
        itemsPayload: orderItemsPayload
      });
      await supabase.from("orders").delete().eq("id", order.id).eq("owner_user_id", user.id);
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId: String(order.id ?? ""),
      orderNumber: String(readOrderField(order, "order_number", "numero_commande") ?? generatedOrderNumber),
      prospectClientId: client.id,
      clientId: client.id
    });
  } catch (error) {
    console.error("ORDER CREATE ERROR", {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Creation commande impossible."
      },
      { status: 500 }
    );
  }
}
