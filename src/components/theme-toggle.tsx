"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Compact 3-state theme toggle (light / dark / system) for the header.
 * - The active state is highlighted with the orange accent color so users
 *   can see at a glance which theme is currently applied.
 * - Tooltip labels are in Urdu to match the rest of the UI.
 * - Server-rendered as a single skeleton icon to avoid hydration mismatch;
 *   the real icons swap in on the client after mount.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // next-themes recommends this exact pattern to avoid hydration mismatch:
  // render a neutral placeholder on the server, swap to the real value after
  // mount. The setState-in-effect here is intentional and safe — it runs once.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  // While not yet mounted, render a neutral placeholder so the server and
  // client markup match. Once mounted, we render the real state.
  const current = theme ?? "system";

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md border border-border bg-card/60 p-0.5",
          className
        )}
        role="group"
        aria-label="تھیم منتخب کریں"
      >
        {/* Light */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-sm tap-target",
                mounted && current === "light"
                  ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-accent/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setTheme("light")}
              aria-label="روشن تھیم"
              aria-pressed={current === "light"}
            >
              <Sun className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">روشن</TooltipContent>
        </Tooltip>

        {/* Dark */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-sm tap-target",
                mounted && current === "dark"
                  ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-accent/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setTheme("dark")}
              aria-label="ڈارک تھیم"
              aria-pressed={current === "dark"}
            >
              <Moon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">ڈارک</TooltipContent>
        </Tooltip>

        {/* System */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-sm tap-target",
                mounted && current === "system"
                  ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-accent/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setTheme("system")}
              aria-label="سسٹم تھیم"
              aria-pressed={current === "system"}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            سسٹم{mounted && resolvedTheme ? ` (${resolvedTheme === "dark" ? "ڈارک" : "روشن"})` : ""}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
