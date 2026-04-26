"use client";

import { ArrowDownUp, Inbox } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar, type FilterOption } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { SearchBar } from "@/components/ui/search-bar";
import { normalizeSearch } from "@/lib/utils";
import type { SortDirection } from "@/types/crm";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number | boolean | undefined;
};

export function DataTable<T>({
  rows,
  columns,
  searchPlaceholder,
  searchKeys,
  filters = [],
  emptyText = "Aucun element."
}: {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys: ((row: T) => string | number | undefined)[];
  filters?: FilterOption[];
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const [filterState, setFilterState] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(null);

  const visibleRows = useMemo(() => {
    const normalized = normalizeSearch(query);
    const filtered = rows.filter((row) => {
      const matchesQuery =
        !normalized ||
        searchKeys.some((getValue) => normalizeSearch(String(getValue(row) ?? "")).includes(normalized));
      const matchesFilters = filters.every((filter) => {
        const selected = filterState[filter.key];
        if (!selected) return true;
        const value = String((row as Record<string, unknown>)[filter.key] ?? "");
        return value === selected;
      });
      return matchesQuery && matchesFilters;
    });

    if (!sort) return filtered;
    const column = columns.find((item) => item.key === sort.key);
    return [...filtered].sort((a, b) => {
      const aValue = column?.accessor?.(a) ?? String((a as Record<string, unknown>)[sort.key] ?? "");
      const bValue = column?.accessor?.(b) ?? String((b as Record<string, unknown>)[sort.key] ?? "");
      const result = String(aValue).localeCompare(String(bValue), "fr", { numeric: true });
      return sort.direction === "asc" ? result : -result;
    });
  }, [columns, filterState, filters, query, rows, searchKeys, sort]);

  function toggleSort(key: string) {
    setSort((current) =>
      current?.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <SearchBar value={query} onChange={setQuery} placeholder={searchPlaceholder} />
        <FilterBar
          filters={filters.map((filter) => ({ ...filter, value: filterState[filter.key] ?? "" }))}
          onChange={(key, value) => setFilterState((current) => ({ ...current, [key]: value }))}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50/80 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} className="px-5 py-4">
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(String(column.key))}
                        className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-left transition hover:text-gray-900"
                      >
                        {column.header}
                        <ArrowDownUp className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {visibleRows.map((row, index) => (
                <tr key={index} className="transition hover:bg-emerald-50/30">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-5 py-4 align-middle text-gray-700">
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[String(column.key)] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState icon={Inbox} title={emptyText} description="Modifiez votre recherche ou retirez un filtre pour afficher plus de resultats." />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination total={visibleRows.length} />
      </div>
    </div>
  );
}
