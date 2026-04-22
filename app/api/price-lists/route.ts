import { NextResponse } from "next/server";
import { createAdminClient } from "@/supabase/admin";
import type { PriceList, PriceListItem, Product } from "@/types/crm";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: lists, error: listsError } = await supabase
      .from("price_lists")
      .select("id,name,effective_date,active,created_at,updated_at")
      .order("effective_date", { ascending: false });

    if (listsError) throw listsError;

    const activeList = lists?.find((list) => list.active) ?? lists?.[0];
    const [{ data: items, error: itemsError }, { data: products, error: productsError }] = await Promise.all([
      activeList
        ? supabase
            .from("price_list_items")
            .select("id,price_list_id,product_id,prix_ht,remise,conditionnement,disponibilite,effective_date,created_at,updated_at")
            .eq("price_list_id", activeList.id)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("products")
        .select("id,categorie_id,reference,code_produit,nom_produit,description_courte,gamme,categorie,conditionnement,unite,ean,tva,actif,fiche_technique_url,fiche_securite_url,notes,created_at,updated_at")
        .eq("actif", true)
    ]);

    if (itemsError) throw itemsError;
    if (productsError) throw productsError;

    const priceLists: PriceList[] = (lists ?? []).map((list) => ({
      id: list.id,
      name: list.name,
      code: list.name,
      geographicScope: "",
      startsAt: list.effective_date,
      isActive: list.active,
      createdAt: list.created_at,
      updatedAt: list.updated_at
    }));

    const priceListItems: PriceListItem[] = (items ?? []).map((item) => ({
      id: item.id,
      priceListId: item.price_list_id,
      productId: item.product_id,
      unitPriceHt: toNumber(item.prix_ht),
      discountPercent: toNumber(item.remise),
      conditioning: item.conditionnement ?? "",
      isAvailable: item.disponibilite !== "indisponible",
      effectiveDate: item.effective_date,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    const mappedProducts: Product[] = (products ?? []).map((product) => ({
      id: product.id,
      categoryId: product.categorie_id ?? "",
      reference: product.reference,
      code: product.code_produit ?? product.reference,
      name: product.nom_produit,
      shortDescription: product.description_courte ?? product.categorie ?? "",
      brand: product.gamme ?? "",
      rangeName: product.gamme ?? product.categorie ?? "",
      packaging: product.conditionnement ?? "",
      unit: product.unite ?? "",
      ean: product.ean ?? "",
      vatRate: toNumber(product.tva),
      isActive: product.actif,
      technicalSheetUrl: product.fiche_technique_url ?? "",
      safetySheetUrl: product.fiche_securite_url ?? undefined,
      notes: product.notes ?? undefined,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }));

    return NextResponse.json({ priceLists, priceListItems, products: mappedProducts, activePriceListId: activeList?.id ?? "" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur tarifs" }, { status: 500 });
  }
}
