"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  accent?: "primary" | "warning" | "danger" | "neutral";
}

const ACCENT_CLASSES = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export function StatCard({ title, value, unit, icon, trend, accent = "neutral" }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon && (
            <div className={`rounded-md p-2 ${ACCENT_CLASSES[accent]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold numeric-input">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {trend && (
          <p
            className={`mt-1 text-xs ${
              trend.direction === "up"
                ? "text-emerald-600"
                : trend.direction === "down"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
