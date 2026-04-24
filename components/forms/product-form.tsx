"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProduct, type SaveProductState } from "@/actions/products";
import type { Product } from "@/types/crm";

const defaultCategories = [
  { id: "cat-vaisselle-machine", name: "Vaisselle machine" },
  { id: "cat-vaisselle-main", name: "Vaisselle main" },
  { id: "cat-sanitaire", name: "Sanitaire" },
  { id: "cat-vitres", name: "Vitres" },
  { id: "cat-ambiance", name: "Ambiance et odeurs" },
  { id: "cat-detartrants", name: "Detartrants" },
  { id: "cat-maintenance", name: "Maintenance technique" },
  { id: "cat-canalisations", name: "Canalisations" },
  { id: "cat-surfaces", name: "Surfaces" }
];

export function ProductForm({
  product,
  categories = defaultCategories
}: {
  product?: Product;
  categories?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const initialState: SaveProductState = { ok: false, message: "" };
  const [state, formAction, pending] = useActionState(saveProduct, initialState);

  useEffect(() => {
    if (!hasSubmitted || !state.ok || !state.productId) return;
    router.push(`/products/${state.productId}`);
    router.refresh();
  }, [hasSubmitted, router, state.ok, state.productId]);

  return (
    <form action={formAction} onSubmit={() => setHasSubmitted(true)} className="grid gap-4 rounded-lg border border-line bg-white p-4 md:grid-cols-2">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <Field label="Reference" name="reference" defaultValue={product?.reference} />
      <Field label="Code" name="code" defaultValue={product?.code} />
      <Field label="Nom produit" name="name" defaultValue={product?.name} />
      <label>
        <span className="mb-1 block text-sm font-medium text-slate-700">Categorie</span>
        <select name="categoryId" defaultValue={product?.categoryId} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm">
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <Field label="Marque" name="brand" defaultValue={product?.brand} />
      <Field label="Gamme" name="rangeName" defaultValue={product?.rangeName} />
      <Field label="Conditionnement" name="packaging" defaultValue={product?.packaging} />
      <Field label="Unite" name="unit" defaultValue={product?.unit} />
      <Field label="EAN" name="ean" defaultValue={product?.ean} />
      <Field label="TVA" name="vatRate" defaultValue={String(product?.vatRate ?? 20)} />
      <Field label="URL fiche technique PDF" name="technicalSheetUrl" defaultValue={product?.technicalSheetUrl} />
      <Field label="URL fiche securite PDF" name="safetySheetUrl" defaultValue={product?.safetySheetUrl} />
      <label className="md:col-span-2">
        <span className="mb-1 block text-sm font-medium text-slate-700">Description courte</span>
        <textarea name="shortDescription" defaultValue={product?.shortDescription} className="focus-ring min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm" />
      </label>
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Enregistrement..." : "Enregistrer le produit"}
        </button>
      </div>
      {hasSubmitted && state.message ? (
        <p className={`md:col-span-2 text-sm ${state.ok ? "text-leaf" : "text-red-600"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input name={name} defaultValue={defaultValue} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
    </label>
  );
}
