"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PriceList, PriceListItem, Product } from "@/types/crm";

export default function PriceListsPage() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPriceLists() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/price-lists", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Impossible de charger les tarifs.");
        }

        if (mounted) {
          setPriceLists(payload.priceLists ?? []);
          setPriceListItems(payload.priceListItems ?? []);
          setProducts(payload.products ?? []);
          setError("");
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Impossible de charger les tarifs.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadPriceLists();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Tarifs"
        description="Tarif BIOLAUR SP 2026 CORSE exploitable en lignes selectionnables pour commande."
        actions={<button className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-medium">Importer CSV / Excel</button>}
      />
      {error ? <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-line bg-white p-6 text-sm font-medium text-slate-500">Chargement du tarif Supabase...</div> : null}
      {!isLoading ? (
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
                  <span className="block text-xs font-normal text-slate-500">{product?.name}</span>
                </Link>
              );
            }
          },
          { key: "conditioning", header: "Conditionnement", sortable: true },
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
                Selectionner
              </Link>
            )
          }
        ]}
      />
      ) : null}
    </>
  );
}
