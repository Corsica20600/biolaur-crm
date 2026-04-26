"use client";

import Link from "next/link";
import { Download, Package, Plus, ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { CategoryBadge } from "@/components/ui/category-badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import type { PriceListItem, Product, ProductCategory } from "@/types/crm";

function categoryLabel(categoryId: string, categories: ProductCategory[]) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Maintenance";
}

export function ProductsCatalog({
  products,
  productCategories,
  priceListItems,
  activePriceListName
}: {
  products: Product[];
  productCategories: ProductCategory[];
  priceListItems: PriceListItem[];
  activePriceListName: string;
}) {
  const priceByProductId = useMemo(
    () =>
      new Map(
        priceListItems.map((item) => [
          item.productId,
          {
            unitPriceHt: item.unitPriceHt,
            discountPercent: item.discountPercent
          }
        ])
      ),
    [priceListItems]
  );
  const ranges = Array.from(new Set(products.map((product) => product.rangeName).filter(Boolean)));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Produits"
        description="Catalogue avec fiches techniques PDF, fiches de securite et ajout rapide en commande."
        actions={
          <Link href="/products/new" className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </Link>
        }
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <Package className="h-3.5 w-3.5" />
          Catalogue commercial actif: {activePriceListName}
        </div>
      </section>
      <DataTable<Product>
        rows={products}
        searchPlaceholder="Rechercher nom, reference, EAN..."
        searchKeys={[(row) => row.name, (row) => row.reference, (row) => row.ean, (row) => row.shortDescription, (row) => row.rangeName]}
        filters={[
          { key: "categoryId", label: "Categorie", value: "", options: productCategories.map((item) => ({ label: item.name, value: item.id })) },
          { key: "rangeName", label: "Gamme", value: "", options: ranges.map((item) => ({ label: item, value: item })) }
        ]}
        columns={[
          {
            key: "reference",
            header: "Reference",
            sortable: true,
            render: (row) => (
              <Link href={`/products/${row.id}`} className="font-semibold text-emerald-700 hover:text-emerald-900">
                {row.reference}
                <span className="block text-xs font-normal text-gray-400">{row.code}</span>
              </Link>
            )
          },
          {
            key: "name",
            header: "Produit",
            sortable: true,
            render: (row) => (
              <div className="min-w-0">
                <Link href={`/products/${row.id}`} className="font-semibold text-gray-950 hover:text-emerald-800">
                  {row.name}
                </Link>
                <p className="mt-1 text-xs text-gray-500">{row.shortDescription || "-"}</p>
              </div>
            )
          },
          {
            key: "categoryId",
            header: "Categorie",
            render: (row) => <CategoryBadge label={categoryLabel(row.categoryId, productCategories)} />
          },
          { key: "packaging", header: "Conditionnement", sortable: true, render: (row) => row.packaging || "-" },
          {
            key: "unitPrice",
            header: "Prix HT",
            sortable: true,
            accessor: (row) => priceByProductId.get(row.id)?.unitPriceHt ?? 0,
            render: (row) => {
              const price = priceByProductId.get(row.id);
              return (
                <>
                  <span className="font-semibold text-gray-950">{formatCurrency(price?.unitPriceHt ?? 0)}</span>
                  {price?.discountPercent ? <span className="ml-2 text-xs font-medium text-emerald-700">-{price.discountPercent}%</span> : null}
                </>
              );
            }
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/products/${row.id}`}
                  className="focus-ring inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-slate-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Fiche
                </Link>
                <Link
                  href="/orders/new"
                  className="focus-ring inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-leaf"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Commander
                </Link>
              </div>
            )
          }
        ]}
        emptyText="Aucun produit."
      />
    </div>
  );
}
