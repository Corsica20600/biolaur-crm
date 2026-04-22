"use client";

import { DocumentUploader } from "@/components/documents/document-uploader";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { productDocuments, products } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import type { ProductDocument } from "@/types/crm";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader title="Documents" description="Fiches techniques, fiches de securite, bons de commande et documents clients." />
      <div className="mb-5">
        <DocumentUploader />
      </div>
      <DataTable<ProductDocument>
        rows={productDocuments}
        searchPlaceholder="Rechercher document, produit, reference..."
        searchKeys={[(row) => row.title, (row) => row.documentType, (row) => products.find((product) => product.id === row.productId)?.reference]}
        filters={[
          { key: "documentType", label: "Type", value: "", options: [{ label: "FT", value: "fiche_technique" }, { label: "FDS", value: "fiche_securite" }, { label: "Plaquette", value: "plaquette" }] }
        ]}
        columns={[
          { key: "title", header: "Document", sortable: true, render: (row) => <a href={row.publicUrl} className="font-medium text-ink hover:text-leaf">{row.title}</a> },
          { key: "documentType", header: "Type", sortable: true },
          { key: "productId", header: "Produit", render: (row) => products.find((product) => product.id === row.productId)?.reference ?? "-" },
          { key: "fileName", header: "Fichier", sortable: true },
          { key: "createdAt", header: "Ajout", sortable: true, render: (row) => formatDate(row.createdAt) }
        ]}
      />
    </>
  );
}
