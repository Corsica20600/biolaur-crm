"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { calculateOrderLineTotal, calculateVat, formatCurrency } from "@/lib/utils";

type FormClient = {
  id: string;
  owner_id: string;
  raison_sociale: string;
  nom_commercial: string | null;
  ville: string | null;
  adresse: string | null;
  code_postal: string | null;
  pays: string | null;
};

type FormProduct = {
  id: string;
  reference: string;
  nom_produit: string;
  description_courte: string | null;
  conditionnement: string | null;
  tarif_ht: number;
  tva: number;
};

type FormPriceItem = {
  id: string;
  product_id: string;
  prix_ht: number;
  remise: number;
  conditionnement: string | null;
};

type DraftLine = {
  productId: string;
  quantity: number;
};

export function OrderForm() {
  const router = useRouter();
  const [clients, setClients] = useState<FormClient[]>([]);
  const [products, setProducts] = useState<FormProduct[]>([]);
  const [priceItems, setPriceItems] = useState<FormPriceItem[]>([]);
  const [clientId, setClientId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFormData() {
      setLoading(true);
      try {
        const response = await fetch("/api/orders/form-data", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as {
          ok: boolean;
          error?: string;
          clients?: FormClient[];
          products?: FormProduct[];
          priceItems?: FormPriceItem[];
        } | null;

        if (!response.ok || !payload?.ok) {
          setError(payload?.error ?? "Chargement impossible.");
          setLoading(false);
          return;
        }

        const loadedClients = payload.clients ?? [];
        const loadedProducts = payload.products ?? [];
        setClients(loadedClients);
        setProducts(loadedProducts);
        setPriceItems(payload.priceItems ?? []);
        setClientId(loadedClients[0]?.id ?? "");
        setLines(loadedProducts[0] ? [{ productId: loadedProducts[0].id, quantity: 1 }] : []);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Chargement impossible.");
      } finally {
        setLoading(false);
      }
    }

    loadFormData();
  }, []);

  const totals = useMemo(() => {
    const totalHt = lines.reduce((sum, line) => {
      const product = products.find((item) => item.id === line.productId);
      const price = priceItems.find((item) => item.product_id === line.productId);
      if (!product) return sum;
      return sum + calculateOrderLineTotal(line.quantity, Number(price?.prix_ht ?? product.tarif_ht ?? 0), Number(price?.remise ?? 0));
    }, 0);
    const totalTva = lines.reduce((sum, line) => {
      const product = products.find((item) => item.id === line.productId);
      const price = priceItems.find((item) => item.product_id === line.productId);
      if (!product) return sum;
      const lineHt = calculateOrderLineTotal(line.quantity, Number(price?.prix_ht ?? product.tarif_ht ?? 0), Number(price?.remise ?? 0));
      return sum + calculateVat(lineHt, Number(product.tva ?? 20));
    }, 0);
    return { totalHt, totalTva, totalTtc: totalHt + totalTva, commission: totalHt * 0.2 };
  }, [lines, priceItems, products]);

  async function createOrder() {
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        comments,
        lines: lines.map((line) => ({ productId: line.productId, quantity: line.quantity }))
      })
    });

    const payload = (await response.json()) as { ok: boolean; orderId?: string; error?: string };
    setSubmitting(false);

    if (!payload.ok || !payload.orderId) {
      setError(payload.error ?? "Creation commande impossible.");
      return;
    }

    router.push(`/orders/${payload.orderId}`);
    router.refresh();
  }

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Chargement des clients, produits et tarifs...</div>;
  }

  if (error && (!clients.length || !products.length)) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-700">{error}</div>;
  }

  if (!clients.length || !products.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Impossible de creer une commande : il faut au moins un client et un produit/tarif dans Supabase.
      </div>
    );
  }

  return (
    <form className="space-y-5">
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div> : null}
      <section className="rounded-lg border border-line bg-white p-4">
        <h2 className="mb-4 font-semibold text-ink">Client existant obligatoire</h2>
        <select value={clientId} onChange={(event) => setClientId(event.target.value)} className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm md:max-w-md">
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.raison_sociale} - {client.ville}
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
            const price = priceItems.find((item) => item.product_id === line.productId);
            const unitPrice = Number(price?.prix_ht ?? product.tarif_ht ?? 0);
            const discount = Number(price?.remise ?? 0);
            const lineTotal = calculateOrderLineTotal(line.quantity, unitPrice, discount);
            return (
              <div key={index} className="grid gap-3 rounded-md border border-line p-3 md:grid-cols-[1fr_110px_120px_120px_44px] md:items-center">
                <select
                  value={line.productId}
                  onChange={(event) =>
                    setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, productId: event.target.value } : item)))
                  }
                  className="focus-ring h-10 rounded-md border border-line px-3 text-sm"
                >
                  {products.map((itemProduct) => (
                    <option key={itemProduct.id} value={itemProduct.id}>
                      {itemProduct.reference} - {itemProduct.nom_produit}
                    </option>
                  ))}
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
                <span className="text-sm text-slate-600">{formatCurrency(unitPrice)}</span>
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
        <textarea
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Commentaire de livraison ou condition client"
          className="focus-ring min-h-28 rounded-lg border border-line bg-white px-3 py-2 text-sm"
        />
        <div className="rounded-lg border border-line bg-white p-4">
          <Row label="Total HT" value={formatCurrency(totals.totalHt)} />
          <Row label="TVA" value={formatCurrency(totals.totalTva)} />
          <Row label="Total TTC" value={formatCurrency(totals.totalTtc)} strong />
          <Row label="Commission estimee" value={formatCurrency(totals.commission)} />
          <button
            type="button"
            onClick={createOrder}
            disabled={submitting}
            className="focus-ring mt-4 w-full rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creation..." : "Creer la commande"}
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
