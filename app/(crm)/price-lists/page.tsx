import { PriceListsCatalog } from "@/components/price-lists/price-lists-catalog";
import { getPriceListCatalog } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function PriceListsPage() {
  const catalog = await getPriceListCatalog();

  return <PriceListsCatalog priceLists={catalog.priceLists} priceListItems={catalog.priceListItems} products={catalog.products} />;
}
