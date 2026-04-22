import { cn } from "@/lib/utils";

const categoryTones: Record<string, string> = {
  "Vaisselle Pro": "border-blue-100 bg-blue-50 text-blue-700",
  "Vaisselle machine": "border-blue-100 bg-blue-50 text-blue-700",
  Technique: "border-violet-100 bg-violet-50 text-violet-700",
  Sanitaire: "border-emerald-100 bg-emerald-50 text-emerald-700",
  Canalisations: "border-yellow-100 bg-yellow-50 text-yellow-800",
  Surfaces: "border-sky-100 bg-sky-50 text-sky-700",
  "Vaisselle main": "border-purple-100 bg-purple-50 text-purple-700",
  "Ambiance et odeurs": "border-orange-100 bg-orange-50 text-orange-700",
  Ambiance: "border-orange-100 bg-orange-50 text-orange-700",
  Detartrants: "border-amber-100 bg-amber-50 text-amber-700",
  Maintenance: "border-gray-200 bg-gray-50 text-gray-700"
};

export function CategoryBadge({ label, className }: { label: string; className?: string }) {
  const tone = categoryTones[label] ?? categoryTones.Maintenance;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tone, className)}>
      {label}
    </span>
  );
}
