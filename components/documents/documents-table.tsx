"use client";

import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import type { ProductDocument } from "@/types/crm";

type ProductLookup = {
  id: string;
  reference: string;
};

export function DocumentsTable({
  rows,
  products
}: {
  rows: ProductDocument[];
  products: ProductLookup[];
}) {
  return (
    <DataTable<ProductDocument>
      rows={rows}
      searchPlaceholder="Rechercher document, produit, reference..."
      searchKeys={[(row) => row.title, (row) => row.documentType, (row) => products.find((product) => product.id === row.productId)?.reference]}
      filters={[
        {
          key: "documentType",
          label: "Type",
          value: "",
          options: [
            { label: "FT", value: "fiche_technique" },
            { label: "FDS", value: "fiche_securite" },
            { label: "Bon commande", value: "bon_commande" },
            { label: "Autres", value: "autre" }
          ]
        }
      ]}
      columns={[
        {
          key: "title",
          header: "Document",
          sortable: true,
          render: (row) => (
            <a href={row.publicUrl} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-leaf">
              {row.title}
            </a>
          )
        },
        { key: "documentType", header: "Type", sortable: true },
        { key: "productId", header: "Produit", render: (row) => products.find((product) => product.id === row.productId)?.reference ?? "-" },
        { key: "fileName", header: "Fichier", sortable: true },
        { key: "createdAt", header: "Ajout", sortable: true, render: (row) => formatDate(row.createdAt) }
      ]}
    />
  );
}
