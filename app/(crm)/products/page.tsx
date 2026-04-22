import { ProductsCatalog } from "@/components/products/products-catalog";
import { getProductCatalog } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  try {
    const catalog = await getProductCatalog();

    return (
      <ProductsCatalog
        products={catalog.products}
        productCategories={catalog.categories}
        priceListItems={catalog.priceListItems}
        activePriceListName={catalog.activePriceListName}
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de chargement du catalogue.";

    return (
      <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-950">Produits</h1>
        <p className="mt-2 text-sm text-red-700">Impossible de charger le catalogue Supabase.</p>
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{message}</p>
      </div>
    );
  }
}
