import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentsTable } from "@/components/documents/documents-table";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/supabase/server";
import type { ProductDocumentType } from "@/types/crm";

function resolveBucket(type: string) {
  if (type === "fiche_technique") return "technical-sheets";
  if (type === "fiche_securite") return "safety-sheets";
  if (type === "bon_commande") return "order-pdfs";
  return "client-documents";
}

function resolveStoragePath(value?: string | null) {
  if (!value) return null;
  const cleaned = value.replace(/^\/+/, "");
  const [bucket, ...pathParts] = cleaned.split("/");
  if (!bucket || !pathParts.length) return null;
  return { bucket, path: pathParts.join("/") };
}

export default async function DocumentsPage() {
  const supabase = await createClient();
  const [{ data: productsRows, error: productsError }, { data: documentRows, error: docsError }] = await Promise.all([
    supabase.from("products").select("id,reference,nom_produit").order("nom_produit", { ascending: true }),
    supabase
      .from("product_documents")
      .select("id,product_id,document_type,title,file_name,storage_path,public_url,mime_type,created_at,updated_at")
      .order("created_at", { ascending: false })
  ]);

  if (productsError) {
    throw new Error(`Chargement produits impossible: ${productsError.message}`);
  }
  if (docsError) {
    throw new Error(`Chargement documents impossible: ${docsError.message}`);
  }

  const products = (productsRows ?? []).map((product) => ({
    id: product.id,
    reference: product.reference,
    name: product.nom_produit
  }));

  const rows = await Promise.all(
    (documentRows ?? []).map(async (document) => {
      const bucket = resolveBucket(document.document_type ?? "autre");
      const storageObject = resolveStoragePath(document.storage_path);
      const path = storageObject?.bucket ? storageObject.path : document.storage_path ?? "";
      const storageBucket = storageObject?.bucket ?? bucket;
      const { data: signedData, error: signedError } = path
        ? await supabase.storage.from(storageBucket).createSignedUrl(path, 60 * 60)
        : { data: null, error: new Error("Missing storage path") };
      const resolvedUrl = signedError ? document.public_url ?? "" : signedData?.signedUrl ?? document.public_url ?? "";

      return {
        id: document.id,
        productId: document.product_id,
        documentType: (document.document_type as ProductDocumentType) ?? "autre",
        title: document.title,
        fileName: document.file_name ?? "",
        storagePath: document.storage_path ?? "",
        publicUrl: resolvedUrl,
        mimeType: document.mime_type ?? "",
        createdAt: document.created_at,
        updatedAt: document.updated_at
      };
    })
  );

  return (
    <>
      <PageHeader title="Documents" description="Fiches techniques, fiches de securite, bons de commande et documents clients." />
      <div className="mb-5">
        <DocumentUploader products={products} />
      </div>
      <DocumentsTable rows={rows} products={products.map((product) => ({ id: product.id, reference: product.reference }))} />
    </>
  );
}
