import { ProductsCatalog } from "@/components/products/products-catalog";
import { getProductCatalog } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const catalog = await getProductCatalog();

  return (
    <ProductsCatalog
      products={catalog.products}
      productCategories={catalog.categories}
      priceListItems={catalog.priceListItems}
      activePriceListName={catalog.activePriceListName}
    />
  );
}
