"use client";

import { UploadCloud } from "lucide-react";

export function DocumentUploader({ prospectClientId, productId }: { prospectClientId?: string; productId?: string }) {
  return (
    <form className="rounded-lg border border-dashed border-line bg-white p-4">
      <input type="hidden" name="prospectClientId" value={prospectClientId ?? ""} />
      <input type="hidden" name="productId" value={productId ?? ""} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-mint text-leaf">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">Ajouter un document</p>
          <p className="text-xs text-slate-500">Buckets prevus : technical-sheets, safety-sheets, order-pdfs, client-documents.</p>
        </div>
        <select name="type" className="focus-ring h-10 rounded-md border border-line px-3 text-sm">
          <option value="fiche_technique">Fiche technique</option>
          <option value="fiche_securite">Fiche securite</option>
          <option value="bon_commande">Bon de commande</option>
          <option value="contrat">Contrat</option>
          <option value="ouverture_compte">Ouverture de compte</option>
          <option value="commercial">Commercial</option>
        </select>
        <input name="file" type="file" accept="application/pdf" className="text-sm" />
        <button type="button" className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
          Uploader
        </button>
      </div>
    </form>
  );
}
