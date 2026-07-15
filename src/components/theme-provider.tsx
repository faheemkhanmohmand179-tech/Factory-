"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Props = React.ComponentProps<typeof NextThemesProvider>;

/**
 * Wraps next-themes so the whole app supports dark / light / system themes.
 * - Default theme: light (white)
 * - Stored under localStorage key "almakkah-theme"
 * - Respects `prefers-color-scheme` when set to "system"
 * - Adds `class="dark"` on <html> when dark mode is active (Tailwind v4
 *   @custom-variant dark handles the rest in globals.css)
 */
export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="almakkah-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
