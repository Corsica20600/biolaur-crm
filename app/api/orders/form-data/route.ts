import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/supabase/admin";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const [{ data: clients, error: clientsError }, { data: products, error: productsError }, { data: priceItems, error: pricesError }] =
      await Promise.all([
        supabase
          .from("clients")
          .select("id,owner_id,raison_sociale,nom_commercial,ville,adresse,code_postal,pays,type_fiche")
          .eq("type_fiche", "client")
          .order("raison_sociale"),
        supabase
          .from("products")
          .select("id,reference,nom_produit,description_courte,conditionnement,tarif_ht,tva,actif")
          .eq("actif", true)
          .order("reference"),
        supabase
          .from("price_list_items")
          .select("id,product_id,prix_ht,remise,conditionnement,disponibilite")
          .order("created_at")
      ]);

    const error = clientsError ?? productsError ?? pricesError;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      clients: clients ?? [],
      products: products ?? [],
      priceItems: priceItems ?? []
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
