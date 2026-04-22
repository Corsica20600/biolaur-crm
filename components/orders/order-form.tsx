"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { clients, priceListItems, products } from "@/lib/demo-data";
import { calculateOrderLineTotal, calculateVat, formatCurrency } from "@/lib/utils";

type DraftLine = {
  productId: string;
  quantity: number;
};

export function OrderForm() {
  const existingClients = clients.filter((client) => client.recordType === "client");
  const [prospectClientId, setProspectClientId] = useState(existingClients[0]?.id ?? "");
  const [lines, setLines] = useState<DraftLine[]>([{ productId: products[0].id, quantity: 1 }]);

  const totals = useMemo(() => {
    const totalHt = lines.reduce((sum, line) => {
      const product = products.find((item) => item.id === line.productId);
      const price = priceListItems.find((item) => item.productId === line.productId);
      if (!product || !price) return sum;
      return sum + calculateOrderLineTotal(line.quantity, price.unitPriceHt, price.discountPercent);
    }, 0);
    const totalTva = calculateVat(totalHt, 20);
    return { totalHt, totalTva, totalTtc: totalHt + totalTva, commission: totalHt * 0.2 };
  }, [lines]);

  return (
    <form className="space-y-5">
      <section className="rounded-lg border border-line bg-white p-4">
        <h2 className="mb-4 font-semibold text-ink">Client existant obligatoire</h2>
        <select value={prospectClientId} onChange={(event) => setProspectClientId(event.target.value)} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm md:max-w-md">
          {existingClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.companyName} - {client.city}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-lg border border-line bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ink">Lignes selectionnees depuis le tarif</h2>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, { productId: products[0].id, quantity: 1 }])}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Ajouter ligne
          </button>
        </div>
        <div className="space-y-3">
          {lines.map((line, index) => {
            const product = products.find((item) => item.id === line.productId) ?? products[0];
            const price = priceListItems.find((item) => item.productId === line.productId);
            const lineTotal = calculateOrderLineTotal(line.quantity, price?.unitPriceHt ?? 0, price?.discountPercent ?? 0);
            return (
              <div key={index} className="grid gap-3 rounded-md border border-line p-3 md:grid-cols-[1fr_110px_120px_120px_44px] md:items-center">
                <select
                  value={line.productId}
                  onChange={(event) =>
                    setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, productId: event.target.value } : item)))
                  }
                  className="focus-ring h-10 rounded-md border border-line px-3 text-sm"
                >
                  {priceListItems.map((item) => {
                    const itemProduct = products.find((productItem) => productItem.id === item.productId);
                    return (
                      <option key={item.id} value={item.productId}>
                        {itemProduct?.reference} - {itemProduct?.name}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(event) =>
                    setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity: Number(event.target.value) } : item)))
                  }
                  className="focus-ring h-10 rounded-md border border-line px-3 text-sm"
                />
                <span className="text-sm text-slate-600">{formatCurrency(price?.unitPriceHt ?? 0)}</span>
                <span className="text-sm font-medium text-ink">{formatCurrency(lineTotal)}</span>
                <button
                  type="button"
                  onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-line text-red-600"
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_320px]">
        <textarea placeholder="Commentaire de livraison ou condition client" className="focus-ring min-h-28 rounded-lg border border-line bg-white px-3 py-2 text-sm" />
        <div className="rounded-lg border border-line bg-white p-4">
          <Row label="Total HT" value={formatCurrency(totals.totalHt)} />
          <Row label="TVA" value={formatCurrency(totals.totalTva)} />
          <Row label="Total TTC" value={formatCurrency(totals.totalTtc)} strong />
          <Row label="Commission estimee" value={formatCurrency(totals.commission)} />
          <button type="button" className="focus-ring mt-4 w-full rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
            Creer la commande
          </button>
        </div>
      </section>
    </form>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-line py-2 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-semibold text-ink" : "font-medium text-slate-700"}>{value}</span>
    </div>
  );
}
