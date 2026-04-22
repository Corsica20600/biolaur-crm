"use client";

import { Send } from "lucide-react";
import { orders, productDocuments, prospectsClients, emailTemplates } from "@/lib/demo-data";

export function EmailComposer({ prospectClientId, orderId }: { prospectClientId?: string; orderId?: string }) {
  const record = prospectsClients.find((item) => item.id === prospectClientId) ?? prospectsClients[0];
  const selectedOrder = orders.find((item) => item.id === orderId);
  const template = selectedOrder ? emailTemplates.find((item) => item.code === "send_order") ?? emailTemplates[0] : emailTemplates[0];

  return (
    <form className="space-y-4 rounded-lg border border-line bg-white p-4">
      <input type="hidden" name="prospectClientId" value={record.id} />
      <input type="hidden" name="orderId" value={orderId ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Destinataire</span>
          <input defaultValue={record.email} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Template</span>
          <select className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm">
            {emailTemplates.map((item) => (
              <option key={item.id} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span className="mb-1 block text-sm font-medium text-slate-700">Objet</span>
        <input defaultValue={template.subjectTemplate} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium text-slate-700">Message</span>
        <textarea defaultValue={template.bodyTemplate} className="focus-ring min-h-40 w-full rounded-md border border-line px-3 py-2 text-sm" />
      </label>
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Pieces jointes historisees</p>
        <div className="grid gap-2 md:grid-cols-2">
          {selectedOrder ? (
            <label className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
              <input type="checkbox" defaultChecked />
              <span>{selectedOrder.orderNumber}.pdf</span>
            </label>
          ) : null}
          {productDocuments
            .filter((doc) => doc.documentType === "fiche_technique")
            .slice(0, 8)
            .map((doc) => (
              <label key={doc.id} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
                <input type="checkbox" />
                <span>{doc.title}</span>
              </label>
            ))}
        </div>
      </div>
      <button type="button" className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
        <Send className="h-4 w-4" />
        Envoyer et historiser
      </button>
    </form>
  );
}
