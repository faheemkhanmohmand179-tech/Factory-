/**
 * Debounce hook for search/filter inputs
 * Prevents excessive re-renders on slow internet
 */
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debounced;
}
