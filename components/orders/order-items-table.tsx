"use client";

import type { OrderItem } from "@/types/crm";
import { formatCurrency } from "@/lib/utils";

export function OrderItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Designation</th>
            <th className="px-4 py-3">Qte</th>
            <th className="px-4 py-3">PU HT</th>
            <th className="px-4 py-3">Remise</th>
            <th className="px-4 py-3 text-right">Total HT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-medium text-ink">{item.productReference}</td>
              <td className="px-4 py-3 text-slate-700">{item.productName}</td>
              <td className="px-4 py-3">{item.quantity}</td>
              <td className="px-4 py-3">{formatCurrency(item.unitPriceHt)}</td>
              <td className="px-4 py-3">{item.discountPercent}%</td>
              <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.lineTotalHt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
