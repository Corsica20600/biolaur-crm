"use client";

import Link from "next/link";
import { Download, Mail, MoreHorizontal, Package, Plus, Search, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionIconButton } from "@/components/ui/action-icon-button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, normalizeSearch } from "@/lib/utils";
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [range, setRange] = useState("");

  const ranges = Array.from(new Set(products.map((product) => product.rangeName).filter(Boolean)));

  const filteredProducts = useMemo(() => {
    const q = normalizeSearch(query);
    return products.filter((product) => {
      const matchesQuery =
        !q ||
        [product.name, product.reference, product.ean, product.shortDescription, product.rangeName].some((value) =>
          normalizeSearch(value ?? "").includes(q)
        );
      const matchesCategory = !category || product.categoryId === category;
      const matchesRange = !range || product.rangeName === range;
      return matchesQuery && matchesCategory && matchesRange;
    });
  }, [category, products, query, range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Package className="h-3.5 w-3.5" />
            Catalogue commercial
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">Produits</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 md:text-base">
            Catalogue avec fiches techniques PDF, fiches de securite et ajout rapide en commande.
          </p>
        </div>
        <button className="premium-button bg-emerald-700 text-white shadow-sm hover:bg-emerald-800">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher nom, reference, EAN..."
              className="focus-ring h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="focus-ring h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-700"
          >
            <option value="">Toutes categories</option>
            {productCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="focus-ring h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-700"
          >
            <option value="">Toutes gammes</option>
            {ranges.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-950">Catalogue produits</h2>
            <p className="text-sm text-gray-500">{filteredProducts.length} produits disponibles dans le tarif actif</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {activePriceListName}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50/80 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4">Categorie</th>
                <th className="px-6 py-4">Gamme</th>
                <th className="px-6 py-4">Conditionnement</th>
                <th className="px-6 py-4 text-right">Prix tarif</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const price = priceListItems.find((item) => item.productId === product.id);
                return (
                  <tr key={product.id} className="transition hover:bg-emerald-50/30">
                    <td className="px-6 py-5 align-middle">
                      <Link href={`/products/${product.id}`} className="font-bold text-emerald-700 hover:text-emerald-900">
                        {product.reference}
                      </Link>
                      <p className="mt-1 text-xs text-gray-400">{product.code}</p>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                          <Package className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <Link href={`/products/${product.id}`} className="font-bold text-gray-950 hover:text-emerald-800">
                            {product.name}
                          </Link>
                          <p className="mt-1 max-w-md truncate text-sm text-gray-500">{product.shortDescription}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <CategoryBadge label={categoryLabel(product.categoryId, productCategories)} />
                    </td>
                    <td className="px-6 py-5 align-middle font-medium text-gray-700">{product.rangeName}</td>
                    <td className="px-6 py-5 align-middle text-gray-600">{product.packaging}</td>
                    <td className="px-6 py-5 text-right align-middle">
                      <span className="font-bold text-gray-950">{formatCurrency(price?.unitPriceHt ?? 0)}</span>
                      {price?.discountPercent ? <p className="mt-1 text-xs font-medium text-emerald-700">-{price.discountPercent}%</p> : null}
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex justify-end gap-2">
                        <a href={product.technicalSheetUrl || "#"} title="Telecharger FT" aria-label="Telecharger FT">
                          <ActionIconButton icon={Download} label="Telecharger FT" asChild>
                            <Download className="h-4 w-4" />
                          </ActionIconButton>
                        </a>
                        <ActionIconButton icon={Mail} label="Envoyer par mail" />
                        <Link href="/orders/new" title="Ajouter a commande" aria-label="Ajouter a commande">
                          <ActionIconButton icon={ShoppingCart} label="Ajouter a commande" asChild>
                            <ShoppingCart className="h-4 w-4" />
                          </ActionIconButton>
                        </Link>
                        <ActionIconButton icon={MoreHorizontal} label="Plus d'actions" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-sm font-medium text-gray-500" colSpan={7}>
                    Aucun produit ne correspond aux filtres.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination total={filteredProducts.length} />
      </section>
    </div>
  );
}
