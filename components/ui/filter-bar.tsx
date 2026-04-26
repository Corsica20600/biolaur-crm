"use client";

export type FilterOption = {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
};

export function FilterBar({
  filters,
  onChange
}: {
  filters: FilterOption[];
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap gap-3">
      {filters.map((filter) => (
        <label key={filter.key} className="min-w-[10rem] flex-1 sm:flex-none">
          <span className="sr-only">{filter.label}</span>
          <select
            value={filter.value}
            onChange={(event) => onChange(filter.key, event.target.value)}
            className="focus-ring h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
