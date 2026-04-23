import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { createAdminClient } from "@/supabase/admin";

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const supabase = createAdminClient();

    const [{ data: clients, error: clientsError }, { data: products, error: productsError }, { data: priceItems, error: pricesError }] =
      await Promise.all([
        supabase
          .from("prospects_clients")
          .select("id,owner_user_id,company_name,trade_name,city,address_line_1,postal_code,country,record_type")
          .eq("owner_user_id", user.id)
          .eq("record_type", "client")
          .order("company_name"),
        supabase
          .from("products")
          .select("id,reference,nom_produit,description_courte,conditionnement,tarif_ht,tva,actif")
          .eq("actif", true)
          .order("reference"),
        supabase
          .from("price_list_items")
          .select("id,product_id,unit_price_ht,discount_percent,conditioning,is_available")
          .order("created_at")
      ]);

    const error = clientsError ?? productsError ?? pricesError;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      clients: (clients ?? []).map((client) => ({
        id: client.id,
        owner_user_id: client.owner_user_id,
        company_name: client.company_name,
        trade_name: client.trade_name,
        city: client.city,
        address_line_1: client.address_line_1,
        postal_code: client.postal_code,
        country: client.country
      })),
      products: products ?? [],
      priceItems: (priceItems ?? []).map((priceItem) => ({
        id: priceItem.id,
        product_id: priceItem.product_id,
        unit_price_ht: priceItem.unit_price_ht,
        discount_percent: priceItem.discount_percent,
        conditioning: priceItem.conditioning,
        is_available: priceItem.is_available
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Chargement des donnees commande impossible."
      },
      { status: 500 }
    );
  }
}
