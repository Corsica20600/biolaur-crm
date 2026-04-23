"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadDocument, type UploadDocumentState } from "@/actions/documents";

const initialState: UploadDocumentState = { ok: false, message: "" };

type ProductOption = {
  id: string;
  reference: string;
  name: string;
};

export function DocumentUploader({
  productId,
  products = []
}: {
  prospectClientId?: string;
  productId?: string;
  products?: ProductOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);

  useEffect(() => {
    if (!hasSubmitted || !state.ok || !formRef.current) return;
    const selectedProduct = productId ? null : (formRef.current.elements.namedItem("productId") as HTMLSelectElement | null)?.value ?? "";
    formRef.current.reset();
    if (!productId && selectedProduct) {
      const productField = formRef.current.elements.namedItem("productId") as HTMLSelectElement | null;
      if (productField) productField.value = selectedProduct;
    }
    router.refresh();
  }, [hasSubmitted, productId, router, state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => setHasSubmitted(true)}
      className="rounded-lg border border-dashed border-line bg-white p-4"
    >
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-mint text-leaf">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">Ajouter un document</p>
          <p className="text-xs text-slate-500">Buckets prevus : technical-sheets, safety-sheets, order-pdfs, client-documents.</p>
        </div>
        {!productId ? (
          <select name="productId" required className="focus-ring h-10 rounded-md border border-line px-3 text-sm">
            <option value="">Selectionner un produit</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.reference} - {product.name}
              </option>
            ))}
          </select>
        ) : null}
        <select name="type" className="focus-ring h-10 rounded-md border border-line px-3 text-sm">
          <option value="fiche_technique">Fiche technique</option>
          <option value="fiche_securite">Fiche securite</option>
          <option value="bon_commande">Bon de commande</option>
          <option value="autre">Autres</option>
        </select>
        <input name="file" type="file" accept="application/pdf" required className="text-sm" />
        <button
          type="submit"
          disabled={pending}
          className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Upload..." : "Uploader"}
        </button>
      </div>
      {hasSubmitted && state.message ? (
        <p className={`mt-3 text-sm font-medium ${state.ok ? "text-leaf" : "text-red-600"}`} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
