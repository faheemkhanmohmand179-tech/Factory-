import * as React from "react"

import { cn } from "@/lib/utils"

// Field types that must always read left-to-right, even inside an
// overall dir="rtl" (Urdu) layout — numbers, dates, phone numbers, emails,
// and URLs are written LTR in Urdu text (this matches how Urdu newspapers
// and forms present numerals: Urdu prose flows RTL, but the digits inside
// stay LTR). Without this, digit order visually flips and users can't type
// numbers/dates correctly.
const LTR_TYPES = new Set(["number", "date", "tel", "email", "url", "time", "datetime-local"]);

function Input({ className, type, dir, ...props }: React.ComponentProps<"input">) {
  const resolvedDir = dir ?? (type && LTR_TYPES.has(type) ? "ltr" : undefined);

  return (
    <input
      type={type}
      dir={resolvedDir}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        resolvedDir === "ltr" && "text-left",
        className
      )}
      {...props}
    />
  )
}

export { Input }
