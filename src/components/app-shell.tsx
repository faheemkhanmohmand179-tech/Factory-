"use client";

import { useState, useSyncExternalStore, lazy, Suspense } from "react";
import {
  LayoutDashboard,
  Mountain,
  Ruler,
  Scissors,
  HardHat,
  Users,
  Disc3 as Sawblade,
  UtensilsCrossed,
  Package,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// Lazy-load all non-dashboard modules for code-splitting
const Dashboard = lazy(() => import("@/modules/dashboard"));
const MarbleTypes = lazy(() => import("@/modules/marble-types"));
const SizesThickness = lazy(() => import("@/modules/sizes-thickness"));
const CuttingRecords = lazy(() => import("@/modules/cutting-records"));
const LabourCategories = lazy(() => import("@/modules/labour-categories"));
const StaffModule = lazy(() => import("@/modules/staff"));
const BladesModule = lazy(() => import("@/modules/blades"));
const FoodExpenses = lazy(() => import("@/modules/food-expenses"));
const Inventory = lazy(() => import("@/modules/inventory"));
const Reports = lazy(() => import("@/modules/reports"));
const SettingsModule = lazy(() => import("@/modules/settings"));

export type ModuleKey =
  | "dashboard"
  | "marble-types"
  | "sizes-thickness"
  | "cutting-records"
  | "labour-categories"
  | "staff"
  | "blades"
  | "food-expenses"
  | "inventory"
  | "reports"
  | "settings";

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "ڈیش بورڈ", icon: LayoutDashboard },
  { key: "marble-types", label: "پتھر کی اقسام", icon: Mountain },
  { key: "sizes-thickness", label: "سائز اور موٹائی", icon: Ruler },
  { key: "cutting-records", label: "کٹنگ ریکارڈ", icon: Scissors },
  { key: "labour-categories", label: "مزدور کی اقسام", icon: HardHat },
  { key: "staff", label: "عملہ اور عہدے", icon: Users },
  { key: "blades", label: "بلیڈ کی اقسام اور استعمال", icon: Sawblade },
  { key: "food-expenses", label: "کھانے کا خرچہ", icon: UtensilsCrossed },
  { key: "inventory", label: "ذخیرہ / انوینٹری", icon: Package },
  { key: "reports", label: "رپورٹس", icon: BarChart3 },
  { key: "settings", label: "ترتیبات", icon: SettingsIcon },
];

// Bottom bar: 5 most-used items on mobile
const BOTTOM_BAR: ModuleKey[] = [
  "dashboard",
  "cutting-records",
  "staff",
  "inventory",
  "reports",
];

function ModuleSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-10 w-48 skeleton-shimmer" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 skeleton-shimmer" />
        ))}
      </div>
      <Skeleton className="h-64 skeleton-shimmer" />
    </div>
  );
}

function renderModule(key: ModuleKey) {
  switch (key) {
    case "dashboard":
      return <Dashboard />;
    case "marble-types":
      return <MarbleTypes />;
    case "sizes-thickness":
      return <SizesThickness />;
    case "cutting-records":
      return <CuttingRecords />;
    case "labour-categories":
      return <LabourCategories />;
    case "staff":
      return <StaffModule />;
    case "blades":
      return <BladesModule />;
    case "food-expenses":
      return <FoodExpenses />;
    case "inventory":
      return <Inventory />;
    case "reports":
      return <Reports />;
    case "settings":
      return <SettingsModule />;
  }
}

// External store for the active tab (localStorage-backed).
// useSyncExternalStore is React's recommended way to read from external stores
// without causing hydration mismatches or cascading renders.
const TAB_STORAGE_KEY = "al-makkah-active-tab";

function subscribeTab(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerTab(): ModuleKey {
  return "dashboard";
}

function getClientTab(): ModuleKey {
  try {
    const saved = localStorage.getItem(TAB_STORAGE_KEY) as ModuleKey | null;
    return saved && NAV_ITEMS.find((n) => n.key === saved) ? saved : "dashboard";
  } catch {
    return "dashboard";
  }
}

export function AppShell() {
  // useSyncExternalStore: server returns "dashboard", client returns localStorage value.
  // React handles the hydration boundary automatically — no mismatch error.
  const active = useSyncExternalStore(subscribeTab, getClientTab, getServerTab);
  const setActive = (key: ModuleKey) => {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, key);
    } catch {
      // ignore quota / privacy errors
    }
    // Manually trigger re-render via storage event (doesn't fire in same tab)
    window.dispatchEvent(new StorageEvent("storage", { key: TAB_STORAGE_KEY }));
  };
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleNavigate(key: ModuleKey) {
    setActive(key);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeItem = NAV_ITEMS.find((n) => n.key === active);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — sticky, with subtle blur. Theme toggle on the left for RTL. */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 max-w-6xl mx-auto">
          {/* Right side (in RTL = visual right = start) — menu + brand */}
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="tap-target shrink-0" aria-label="مینو کھولیں">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-0" dir="rtl">
                <SheetHeader className="border-b border-border p-4 text-right">
                  <SheetTitle className="font-heading text-xl text-right">
                    المکہ فیکٹری
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground text-right">
                    زیادہ خان اور امتیاز خان
                  </p>
                </SheetHeader>
                <nav
                  className="flex flex-col gap-0.5 p-2 overflow-y-auto custom-scrollbar"
                  style={{ maxHeight: "calc(100vh - 100px)" }}
                >
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNavigate(item.key)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-3 text-right transition-colors tap-target",
                          isActive
                            ? "nav-item-active"
                            : "hover:bg-muted text-foreground/80"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}

                  {/* Theme toggle inside drawer for easy mobile access */}
                  <div className="mt-4 border-t border-border pt-4 px-3">
                    <p className="text-xs text-muted-foreground mb-2 text-right">تھیم</p>
                    <ThemeToggle className="w-full justify-center" />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 min-w-0">
              <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                <Mountain className="h-5 w-5 text-primary" />
              </div>
              <div className="hidden xs:block sm:block min-w-0">
                <h1 className="font-heading text-base font-bold leading-tight truncate">
                  المکہ فیکٹری
                </h1>
                <p className="text-xs text-muted-foreground leading-tight truncate">
                  ماربل پروسیسنگ سسٹم
                </p>
              </div>
            </div>
          </div>

          {/* Left side (in RTL = visual left = end) — active label + theme toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-muted-foreground hidden md:block">
              {activeItem?.label}
            </span>
            {/* Theme toggle — hidden on very small screens, visible sm+ */}
            <ThemeToggle className="hidden sm:inline-flex" />
          </div>
        </div>
      </header>

      {/* Main content — generous bottom padding on mobile for bottom nav */}
      <main className="flex-1 p-3 sm:p-4 pb-28 md:pb-8 max-w-6xl w-full mx-auto">
        <Suspense fallback={<ModuleSkeleton />}>
          {renderModule(active)}
        </Suspense>
      </main>

      {/* Bottom navigation - mobile only */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm md:hidden"
        dir="rtl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-stretch justify-around">
          {BOTTOM_BAR.map((key) => {
            const item = NAV_ITEMS.find((n) => n.key === key);
            if (!item) return null;
            const Icon = item.icon;
            const isActive = active === key;
            return (
              <li key={key} className="flex-1">
                <button
                  onClick={() => handleNavigate(key)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 px-1 w-full tap-target",
                    isActive
                      ? "bottom-nav-active"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ fontWeight: isActive ? 700 : 400 }}
                  aria-pressed={isActive}
                  aria-label={item.label}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] leading-tight text-center">
                    {item.label.split(" ")[0]}
                  </span>
                </button>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center gap-0.5 py-2 px-1 w-full tap-target text-muted-foreground hover:text-foreground"
              aria-label="مزید مینو"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] leading-tight">مزید</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
