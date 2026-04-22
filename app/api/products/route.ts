import { NextResponse } from "next/server";
import { createAdminClient } from "@/supabase/admin";
import type { PriceListItem, Product, ProductCategory } from "@/types/crm";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const [{ data: categories, error: categoriesError }, { data: products, error: productsError }, { data: priceLists, error: listsError }] =
      await Promise.all([
        supabase
          .from("product_categories")
          .select("id,name,slug,parent_id,created_at,updated_at")
          .order("name", { ascending: true }),
        supabase
          .from("products")
          .select(
            "id,categorie_id,reference,code_produit,nom_produit,description_courte,gamme,categorie,sous_categorie,conditionnement,unite,ean,tarif_ht,tva,actif,fiche_technique_url,fiche_securite_url,notes,created_at,updated_at"
          )
          .eq("actif", true)
          .order("nom_produit", { ascending: true }),
        supabase.from("price_lists").select("id,name,effective_date,active,created_at,updated_at").eq("active", true).order("effective_date", { ascending: false }).limit(1)
      ]);

    if (categoriesError) throw categoriesError;
    if (productsError) throw productsError;
    if (listsError) throw listsError;

    const activePriceList = priceLists?.[0];
    const { data: priceItems, error: priceItemsError } = activePriceList
      ? await supabase
          .from("price_list_items")
          .select("id,price_list_id,product_id,prix_ht,remise,conditionnement,disponibilite,effective_date,created_at,updated_at")
          .eq("price_list_id", activePriceList.id)
      : { data: [], error: null };

    if (priceItemsError) throw priceItemsError;

    const mappedCategories: ProductCategory[] = (categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug ?? category.name.toLowerCase().replaceAll(" ", "-"),
      parentId: category.parent_id ?? undefined,
      createdAt: category.created_at,
      updatedAt: category.updated_at
    }));

    const mappedProducts: Product[] = (products ?? []).map((product) => ({
      id: product.id,
      categoryId: product.categorie_id ?? "",
      reference: product.reference,
      code: product.code_produit ?? product.reference,
      name: product.nom_produit,
      shortDescription: product.description_courte ?? product.sous_categorie ?? "",
      longDescription: [product.categorie, product.sous_categorie].filter(Boolean).join(" | "),
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

    const mappedPriceItems: PriceListItem[] = (priceItems ?? []).map((item) => ({
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

    return NextResponse.json({
      products: mappedProducts,
      categories: mappedCategories,
      priceListItems: mappedPriceItems,
      activePriceListName: activePriceList?.name ?? "Tarif actif"
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur catalogue" }, { status: 500 });
  }
}
