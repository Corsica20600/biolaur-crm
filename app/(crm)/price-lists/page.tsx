import { PriceListsCatalog } from "@/components/price-lists/price-lists-catalog";
import { getPriceListCatalog } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function PriceListsPage() {
  try {
    const catalog = await getPriceListCatalog();

    return <PriceListsCatalog priceLists={catalog.priceLists} priceListItems={catalog.priceListItems} products={catalog.products} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de chargement des tarifs.";

    return (
      <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-950">Tarifs</h1>
        <p className="mt-2 text-sm text-red-700">Impossible de charger les tarifs Supabase.</p>
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{message}</p>
      </div>
    );
  }
}
