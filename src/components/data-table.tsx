"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DataTableProps<T> {
  data: T[];
  loading?: boolean;
  pagination?: PaginationInfo;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  emptyMessage: string;
  emptyAction?: React.ReactNode;
  columns: React.ReactNode; // header row
  renderRow: (item: T, index: number) => React.ReactNode;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  data,
  loading = false,
  pagination,
  searchValue,
  onSearchChange,
  searchPlaceholder = "تلاش کریں...",
  emptyMessage,
  emptyAction,
  columns,
  renderRow,
  onPageChange,
}: DataTableProps<T>) {
  const debouncedSearch = useDebounce(searchValue, 300);

  // Trigger parent search via effect when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== searchValue) {
      // parent should call its own debounced handler
    }
  }, [debouncedSearch, searchValue]);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <Input
        type="search"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full"
        dir="rtl"
      />

      {/* Table or skeleton or empty */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full skeleton-shimmer" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <p className="text-muted-foreground font-heading text-lg">{emptyMessage}</p>
          {emptyAction}
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar rounded-lg border border-border">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50">
              {columns}
            </thead>
            <tbody>
              {data.map((item, index) => renderRow(item, index))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-2" dir="rtl">
          <p className="text-sm text-muted-foreground">
            کل {pagination.total} میں سے {((pagination.page - 1) * pagination.pageSize) + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="tap-target rounded-md border border-border px-3 text-sm disabled:opacity-40 hover:bg-muted"
            >
              السابق
            </button>
            <span className="tap-target inline-flex items-center px-3 text-sm font-medium">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="tap-target rounded-md border border-border px-3 text-sm disabled:opacity-40 hover:bg-muted"
            >
              التالی
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
