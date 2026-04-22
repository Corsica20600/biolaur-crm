import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: "default" | "green" | "amber";
}) {
  return (
    <div className="premium-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{value}</p>
          {helper ? <p className="mt-1 text-xs font-medium text-gray-500">{helper}</p> : null}
        </div>
        <span
          className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl",
            tone === "green" && "bg-emerald-50 text-emerald-700",
            tone === "amber" && "bg-amber-50 text-amber-700",
            tone === "default" && "bg-slate-100 text-slate-700"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
