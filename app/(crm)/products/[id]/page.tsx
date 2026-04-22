import Link from "next/link";
import { ArrowLeft, Download, Mail, Plus } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createAdminClient } from "@/supabase/admin";
import type { Product, ProductCategory, ProductDocument } from "@/types/crm";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const [{ data: productRow }, { data: docsRows }, { data: priceRows }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,categorie_id,reference,code_produit,nom_produit,description_courte,gamme,categorie,sous_categorie,conditionnement,unite,ean,tarif_ht,tva,actif,fiche_technique_url,fiche_securite_url,notes,created_at,updated_at"
      )
      .eq("id", id)
      .single(),
    supabase.from("product_documents").select("id,product_id,document_type,title,file_name,storage_path,public_url,mime_type,created_at,updated_at").eq("product_id", id),
    supabase.from("price_list_items").select("prix_ht").eq("product_id", id).limit(1)
  ]);

  if (!productRow) {
    return (
      <div className="rounded-xl border border-line bg-white p-6">
        <Link href="/products" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-leaf">
          <ArrowLeft className="h-4 w-4" />
          Retour catalogue
        </Link>
        <h1 className="text-xl font-semibold text-ink">Produit introuvable</h1>
      </div>
    );
  }

  const product: Product = {
    id: productRow.id,
    categoryId: productRow.categorie_id ?? "",
    reference: productRow.reference,
    code: productRow.code_produit ?? productRow.reference,
    name: productRow.nom_produit,
    shortDescription: productRow.description_courte ?? productRow.sous_categorie ?? "",
    longDescription: [productRow.categorie, productRow.sous_categorie].filter(Boolean).join(" | "),
    brand: productRow.gamme ?? "",
    rangeName: productRow.gamme ?? productRow.categorie ?? "",
    packaging: productRow.conditionnement ?? "",
    unit: productRow.unite ?? "",
    ean: productRow.ean ?? "",
    vatRate: toNumber(productRow.tva),
    isActive: productRow.actif,
    technicalSheetUrl: productRow.fiche_technique_url ?? "",
    safetySheetUrl: productRow.fiche_securite_url ?? undefined,
    notes: productRow.notes ?? undefined,
    createdAt: productRow.created_at,
    updatedAt: productRow.updated_at
  };
  const category: ProductCategory = {
    id: product.categoryId,
    name: productRow.sous_categorie ?? productRow.categorie ?? "-",
    slug: "",
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
  const price = { unitPriceHt: toNumber(priceRows?.[0]?.prix_ht ?? productRow.tarif_ht) };
  const docs: ProductDocument[] = (docsRows ?? []).map((doc) => ({
    id: doc.id,
    productId: doc.product_id,
    documentType: doc.document_type,
    title: doc.title,
    fileName: doc.file_name ?? "",
    storagePath: doc.storage_path ?? "",
    publicUrl: doc.public_url ?? "",
    mimeType: doc.mime_type ?? "",
    createdAt: doc.created_at,
    updatedAt: doc.updated_at
  }));

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
            <a href={product.technicalSheetUrl || "#"} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium">
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
            <Info label="Prix tarif HT" value={formatCurrency(price.unitPriceHt)} />
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
