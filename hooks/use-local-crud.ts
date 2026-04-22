"use client";

import { useMemo, useState } from "react";

export function useLocalCrud<T extends { id: string }>(initialRows: T[]) {
  const [rows, setRows] = useState(initialRows);

  return useMemo(
    () => ({
      rows,
      create(row: T) {
        setRows((current) => [row, ...current]);
      },
      update(id: string, patch: Partial<T>) {
        setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
      },
      remove(id: string) {
        setRows((current) => current.filter((row) => row.id !== id));
      }
    }),
    [rows]
  );
}
