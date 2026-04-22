import { cn } from "@/lib/utils";
import { actionStatusLabels, commercialStatusLabels, commissionStatusLabels, orderStatusLabels, recordTypeLabels, statusTone } from "@/lib/status";
import type { ActionStatus, CommercialStatus, CommissionStatus, OrderStatus, RecordType } from "@/types/crm";

type Status = CommercialStatus | OrderStatus | ActionStatus | CommissionStatus | RecordType;

const toneClass = {
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  red: "border-rose-100 bg-rose-50 text-rose-700"
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const labels = { ...recordTypeLabels, ...commercialStatusLabels, ...orderStatusLabels, ...actionStatusLabels, ...commissionStatusLabels };
  const tone = statusTone[status] ?? "neutral";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", toneClass[tone], className)}>
      {labels[status] ?? status}
    </span>
  );
}
