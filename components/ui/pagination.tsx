import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ total, pageSize = 10 }: { total: number; pageSize?: number }) {
  const shown = Math.min(total, pageSize);
  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Affichage de <span className="font-semibold text-gray-900">{shown}</span> sur{" "}
        <span className="font-semibold text-gray-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <select className="focus-ring h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700">
          <option>10 / page</option>
          <option>25 / page</option>
          <option>50 / page</option>
        </select>
        <button className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-gray-200 bg-white text-gray-400" aria-label="Page precedente">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-gray-200 bg-white text-gray-700" aria-label="Page suivante">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
