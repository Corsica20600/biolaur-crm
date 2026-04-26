"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PriceList, PriceListItem, Product } from "@/types/crm";

export function PriceListsCatalog({
  priceLists,
  priceListItems,
  products
}: {
  priceLists: PriceList[];
  priceListItems: PriceListItem[];
  products: Product[];
}) {
  return (
    <>
      <PageHeader
        title="Tarifs"
        description="Tarif BIOLAUR SP 2026 CORSE exploitable en lignes selectionnables pour commande."
        actions={<button className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-medium">Importer CSV / Excel</button>}
      />
      <DataTable<PriceListItem>
        rows={priceListItems}
        searchPlaceholder="Rechercher produit, reference, conditionnement..."
        searchKeys={[
          (row) => products.find((product) => product.id === row.productId)?.name,
          (row) => products.find((product) => product.id === row.productId)?.reference,
          (row) => row.conditioning
        ]}
        filters={[
          { key: "priceListId", label: "Liste tarifaire", value: "", options: priceLists.map((list) => ({ label: list.name, value: list.id })) },
          { key: "isAvailable", label: "Disponibilite", value: "", options: [{ label: "Disponible", value: "true" }, { label: "Indisponible", value: "false" }] }
        ]}
        columns={[
          {
            key: "productId",
            header: "Produit",
            sortable: true,
            render: (row) => {
              const product = products.find((item) => item.id === row.productId);
              return (
                <Link href={`/products/${row.productId}`} className="font-medium text-ink hover:text-leaf">
                  {product?.reference}
                  <span className="mt-0.5 block max-w-xs text-xs font-normal text-slate-500">{product?.name}</span>
                </Link>
              );
            }
          },
          { key: "conditioning", header: "Cond.", sortable: true },
          { key: "unitPriceHt", header: "Prix HT", sortable: true, accessor: (row) => row.unitPriceHt, render: (row) => formatCurrency(row.unitPriceHt) },
          { key: "discountPercent", header: "Remise", sortable: true, render: (row) => `${row.discountPercent}%` },
          { key: "isAvailable", header: "Dispo", sortable: true, render: (row) => (row.isAvailable ? "Disponible" : "Indisponible") },
          { key: "updatedAt", header: "MAJ", sortable: true, render: (row) => formatDate(row.updatedAt) },
          {
            key: "select",
            header: "Commande",
            render: () => (
              <Link href="/orders/new" className="focus-ring inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-leaf">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Link>
            )
          }
        ]}
      />
    </>
  );
}
