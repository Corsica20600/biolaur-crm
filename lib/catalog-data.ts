import { createServerSupabaseClient } from "@/supabase/admin";
import type { PriceList, PriceListItem, Product, ProductCategory } from "@/types/crm";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function resolveStorageObject(value?: string | null, fallbackBucket = "technical-sheets") {
  if (!value) return null;

  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex >= 0) {
      const objectPath = url.pathname.slice(markerIndex + marker.length).replace(/^public\//, "").replace(/^sign\//, "");
      const [bucket, ...pathParts] = objectPath.split("/");
      return bucket && pathParts.length ? { bucket, path: decodeURIComponent(pathParts.join("/")) } : null;
    }
  } catch {
    // Not a URL; treat it as a storage path.
  }

  const cleaned = value.replace(/^\/+/, "");
  const [bucketCandidate, ...pathParts] = cleaned.split("/");
  if (["technical-sheets", "safety-sheets", "order-pdfs", "client-documents"].includes(bucketCandidate) && pathParts.length) {
    return { bucket: bucketCandidate, path: pathParts.join("/") };
  }

  return { bucket: fallbackBucket, path: cleaned };
}

export async function createSignedStorageUrl(supabase: ReturnType<typeof createServerSupabaseClient>, value?: string | null, fallbackBucket = "technical-sheets") {
  const object = resolveStorageObject(value, fallbackBucket);
  if (!object?.path) return "";

  const { data, error } = await supabase.storage.from(object.bucket).createSignedUrl(object.path, 60 * 60);
  return error ? "" : (data.signedUrl ?? "");
}

export async function getProductCatalog() {
  const supabase = createServerSupabaseClient();

  const [{ data: categories, error: categoriesError }, { data: products, error: productsError }, { data: priceLists, error: listsError }] =
    await Promise.all([
      supabase.from("product_categories").select("id,name,slug,parent_id,created_at,updated_at").order("name", { ascending: true }),
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

  const productIds = (products ?? []).map((product) => product.id);
  const { data: documentRows } = productIds.length
    ? await supabase
        .from("product_documents")
        .select("product_id,document_type,storage_path,public_url")
        .in("product_id", productIds)
        .eq("document_type", "fiche_technique")
    : { data: [] };

  const signedTechnicalSheets = new Map<string, string>();
  await Promise.all(
    (documentRows ?? []).map(async (document) => {
      if (signedTechnicalSheets.has(document.product_id)) return;
      const signedUrl = await createSignedStorageUrl(supabase, document.storage_path ?? document.public_url, "technical-sheets");
      if (signedUrl) signedTechnicalSheets.set(document.product_id, signedUrl);
    })
  );

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
    technicalSheetUrl: signedTechnicalSheets.get(product.id) ?? product.fiche_technique_url ?? "",
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

  return {
    products: mappedProducts,
    categories: mappedCategories,
    priceListItems: mappedPriceItems,
    activePriceListName: activePriceList?.name ?? "Tarif actif"
  };
}

export async function getPriceListCatalog() {
  const supabase = createServerSupabaseClient();

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

  const productIds = (products ?? []).map((product) => product.id);
  const { data: documentRows } = productIds.length
    ? await supabase
        .from("product_documents")
        .select("product_id,document_type,storage_path,public_url")
        .in("product_id", productIds)
        .eq("document_type", "fiche_technique")
    : { data: [] };

  const signedTechnicalSheets = new Map<string, string>();
  await Promise.all(
    (documentRows ?? []).map(async (document) => {
      if (signedTechnicalSheets.has(document.product_id)) return;
      const signedUrl = await createSignedStorageUrl(supabase, document.storage_path ?? document.public_url, "technical-sheets");
      if (signedUrl) signedTechnicalSheets.set(document.product_id, signedUrl);
    })
  );

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
    technicalSheetUrl: signedTechnicalSheets.get(product.id) ?? product.fiche_technique_url ?? "",
    safetySheetUrl: product.fiche_securite_url ?? undefined,
    notes: product.notes ?? undefined,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  }));

  return { priceLists, priceListItems, products: mappedProducts, activePriceListId: activeList?.id ?? "" };
}
