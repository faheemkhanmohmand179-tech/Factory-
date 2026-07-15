"use client";

import { useEffect, useState } from "react";
import { Scissors, Users, Disc3 as Sawblade, UtensilsCrossed, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatWeight } from "@/lib/weight-calc";
import { format } from "date-fns";

interface DashboardData {
  today: {
    cuttingCount: number;
    cuttingWeightTons: number;
    activeStaff: number;
    foodCost: number;
  };
  totals: {
    staff: number;
    marbleTypes: number;
    activeBlades: number;
    lowStockBlades: number;
  };
  recent: {
    cutting: Array<{
      id: string;
      date: string;
      actualWeight: number | null;
      calculatedWeight: number | null;
      marbleType: { nameUrdu: string };
      size: { label: string };
      thickness: { label: string };
    }>;
    food: Array<{
      id: string;
      date: string;
      itemName: string;
      cost: number;
      category: { nameUrdu: string };
    }>;
  };
}

export default function DashboardModule() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("dashboard fetch failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-9 w-48 skeleton-shimmer mb-2" />
          <Skeleton className="h-4 w-72 skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 skeleton-shimmer" />
          ))}
        </div>
        <Skeleton className="h-64 skeleton-shimmer" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">ڈیش بورڈ ڈیٹا لوڈ نہیں ہوسکا۔ براہ کرم دوبارہ کوشش کریں۔</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-heading text-2xl font-bold">ڈیش بورڈ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          آج کا خلاصہ — {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="آج کی کٹنگ"
          value={data.today.cuttingCount}
          unit="ریکارڈ"
          icon={<Scissors className="h-4 w-4" />}
          accent="primary"
        />
        <StatCard
          title="آج کا وزن"
          value={data.today.cuttingWeightTons}
          unit="ٹن"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="primary"
        />
        <StatCard
          title="فعال عملہ"
          value={data.today.activeStaff}
          unit={`/ ${data.totals.staff}`}
          icon={<Users className="h-4 w-4" />}
          accent="neutral"
        />
        <StatCard
          title="آج کا کھانے کا خرچہ"
          value={`₨ ${data.today.foodCost.toLocaleString("ur-PK")}`}
          icon={<UtensilsCrossed className="h-4 w-4" />}
          accent="neutral"
        />
      </div>

      {/* Alerts row */}
      {data.totals.lowStockBlades > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">{data.totals.lowStockBlades}</span> بلیڈز کمزور حالت میں ہیں۔ دوبارہ آرڈر کرنے کی ضرورت ہو سکتی ہے۔
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent cutting */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">حالیہ کٹنگ ریکارڈ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recent.cutting.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                ابھی کوئی کٹنگ ریکارڈ نہیں ہے۔
              </p>
            ) : (
              data.recent.cutting.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{r.marbleType?.nameUrdu ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.size?.label} • {r.thickness?.label}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-medium numeric-input">
                      {formatWeight(r.actualWeight ?? r.calculatedWeight)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.date), "d MMM")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent food expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">حالیہ کھانے کا خرچہ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recent.food.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                ابھی کوئی کھانے کا خرچہ نہیں ہے۔
              </p>
            ) : (
              data.recent.food.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{e.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category?.nameUrdu} • {format(new Date(e.date), "d MMM")}
                    </p>
                  </div>
                  <p className="text-sm font-medium numeric-input shrink-0">
                    ₨ {e.cost.toLocaleString("ur-PK")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold numeric-input">{data.totals.marbleTypes}</p>
            <p className="text-xs text-muted-foreground">پتھر کی اقسام</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold numeric-input">{data.totals.activeBlades}</p>
            <p className="text-xs text-muted-foreground">فعال بلیڈز</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold numeric-input">{data.totals.staff}</p>
            <p className="text-xs text-muted-foreground">کل عملہ</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
