"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Disc3 as Sawblade, UtensilsCrossed } from "lucide-react";

interface ReportData {
  range: string;
  totalCuttingRecords: number;
  totalCuttingWeight: number;
  totalFoodCost: number;
  cuttingByDay: Record<string, { count: number; weight: number }>;
  cuttingByType: Record<string, { count: number; weight: number }>;
  foodByCategory: Record<string, number>;
  bladeSummary: Array<{ id: string; bladeType: string; brand: string | null; condition: string; serialNumber: string | null; reorderPoint: number }>;
  attendanceSummary: Record<string, { present: number; absent: number; halfDay: number; leave: number }>;
  totalStaff: number;
}

const RANGE_LABELS: Record<string, string> = {
  today: "آج",
  week: "پچھلے 7 دن",
  month: "پچھلا مہینہ",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "نیا",
  good: "اچھا",
  worn: "کمزور",
  broken: "ٹوٹا",
};

export default function ReportsModule() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("week");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // Set loading before fetch via flag pattern (avoids synchronous setState in effect)
    let pending = true;
    fetch(`/api/reports?range=${range}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setData(d);
          pending = false;
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) {
          pending = false;
          setLoading(false);
        }
      });
    // re-enable loading on range change (deferred via microtask)
    Promise.resolve().then(() => {
      if (pending && !cancelled) setLoading(true);
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [range]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 skeleton-shimmer" />)}
        </div>
        <Skeleton className="h-64 skeleton-shimmer" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center py-16 text-muted-foreground">رپورٹ لوڈ نہیں ہوسکی۔</p>;
  }

  const maxByDay = Math.max(1, ...Object.values(data.cuttingByDay).map((d) => d.weight));
  const maxByType = Math.max(1, ...Object.values(data.cuttingByType).map((d) => d.weight));
  const maxFood = Math.max(1, ...Object.values(data.foodByCategory));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">رپورٹس</h2>
          <p className="text-sm text-muted-foreground mt-1">کٹنگ، عملہ، بلیڈ اور کھانے کے خرچے کا خلاصہ۔</p>
        </div>
        <div className="flex gap-1">
          {(["today", "week", "month"] as const).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
            >
              {RANGE_LABELS[r]}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>کٹنگ ریکارڈ</span>
            </div>
            <p className="text-2xl font-bold numeric-input">{data.totalCuttingRecords}</p>
            <p className="text-xs text-muted-foreground">وزن: {data.totalCuttingWeight} ٹن</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <UtensilsCrossed className="h-4 w-4" />
              <span>کھانے کا کل خرچہ</span>
            </div>
            <p className="text-2xl font-bold numeric-input">₨ {data.totalFoodCost.toLocaleString("ur-PK")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" />
              <span>کل عملہ</span>
            </div>
            <p className="text-2xl font-bold numeric-input">{data.totalStaff}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cutting by day (bar chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            روزانہ کٹنگ ({RANGE_LABELS[range]})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.cuttingByDay).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">کوئی ڈیٹا نہیں۔</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.cuttingByDay)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([day, info]) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0 numeric-input">{day}</span>
                    <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-md transition-all"
                        style={{ width: `${(info.weight / maxByDay) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs numeric-input w-20 shrink-0 text-left">
                      {info.weight.toFixed(2)} ٹن
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cutting by marble type */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">پتھر کی قسم کے لحاظ سے کٹنگ</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.cuttingByType).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">کوئی ڈیٹا نہیں۔</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.cuttingByType).map(([type, info]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-sm w-32 shrink-0 truncate">{type}</span>
                  <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full bg-secondary-foreground rounded-md transition-all"
                      style={{ width: `${(info.weight / maxByType) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs numeric-input w-28 shrink-0 text-left">
                    {info.weight.toFixed(2)} ٹن ({info.count})
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Food expenses by category */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">کھانے کا خرچہ — قسم کے لحاظ سے</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.foodByCategory).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">کوئی ڈیٹا نہیں۔</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.foodByCategory).map(([cat, cost]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm w-32 shrink-0 truncate">{cat}</span>
                  <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full bg-chart-4 rounded-md transition-all"
                      style={{ width: `${(cost / maxFood) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs numeric-input w-24 shrink-0 text-left">
                    ₨ {cost.toLocaleString("ur-PK")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blade summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Sawblade className="h-5 w-5 text-primary" />
            بلیڈز کا خلاصہ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.bladeSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">کوئی بلیڈ نہیں۔</p>
          ) : (
            <ul className="space-y-2">
              {data.bladeSummary.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <div>
                    <span className="font-medium">{b.bladeType}</span>
                    {b.brand && <span className="text-xs text-muted-foreground"> • {b.brand}</span>}
                    {b.serialNumber && <span className="text-xs text-muted-foreground"> • #{b.serialNumber}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ری آرڈر: {b.reorderPoint}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      b.condition === "new" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      b.condition === "good" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {CONDITION_LABELS[b.condition] ?? b.condition}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Attendance summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            حاضری کا خلاصہ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.attendanceSummary).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">کوئی حاضری ڈیٹا نہیں۔</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="p-2 text-right">نام</th>
                    <th className="p-2 text-center">حاضر</th>
                    <th className="p-2 text-center">غیر حاضر</th>
                    <th className="p-2 text-center">نصف دن</th>
                    <th className="p-2 text-center">چھٹی</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.attendanceSummary).map(([name, a]) => (
                    <tr key={name} className="border-b border-border last:border-0">
                      <td className="p-2 font-medium">{name}</td>
                      <td className="p-2 text-center numeric-input text-emerald-600">{a.present}</td>
                      <td className="p-2 text-center numeric-input text-destructive">{a.absent}</td>
                      <td className="p-2 text-center numeric-input">{a.halfDay}</td>
                      <td className="p-2 text-center numeric-input">{a.leave}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
