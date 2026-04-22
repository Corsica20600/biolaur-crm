import Link from "next/link";
import { ArrowLeft, Download, Mail, Plus } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/page-header";
import { priceListItems, productCategories, productDocuments, products } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => item.id === id) ?? products[0];
  const category = productCategories.find((item) => item.id === product.categoryId);
  const price = priceListItems.find((item) => item.productId === product.id);
  const docs = productDocuments.filter((doc) => doc.productId === product.id);

  return (
    <>
      <Link href="/products" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-leaf">
        <ArrowLeft className="h-4 w-4" />
        Retour catalogue
      </Link>
      <PageHeader
        title={product.name}
        description={`${product.reference} - ${product.packaging}`}
        actions={
          <>
            <a href={product.technicalSheetUrl} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              FT PDF
            </a>
            <button className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Envoyer FT
            </button>
            <Link href="/orders/new" className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-3 py-2 text-sm font-medium text-white">
              <Plus className="h-4 w-4" />
              Ajouter a commande
            </Link>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm text-slate-600">{product.shortDescription}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Info label="Categorie" value={category?.name} />
            <Info label="Gamme" value={product.rangeName} />
            <Info label="Marque" value={product.brand} />
            <Info label="EAN" value={product.ean} />
            <Info label="Prix tarif HT" value={formatCurrency(price?.unitPriceHt ?? 0)} />
            <Info label="TVA" value={`${product.vatRate}%`} />
            <Info label="Cree le" value={formatDate(product.createdAt)} />
            <Info label="Mis a jour" value={formatDate(product.updatedAt)} />
          </div>
        </section>
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 font-semibold text-ink">Documents produit</h2>
          {docs.map((doc) => (
            <a key={doc.id} href={doc.publicUrl} className="mb-2 block rounded-md border border-line p-3 text-sm hover:bg-slate-50">
              {doc.title}
              <span className="block text-xs text-slate-500">{doc.documentType}</span>
            </a>
          ))}
        </section>
      </div>
      <section className="mt-6">
        <h2 className="mb-3 font-semibold text-ink">Modifier le produit</h2>
        <ProductForm product={product} />
      </section>
    </>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || "-"}</p>
    </div>
  );
}
