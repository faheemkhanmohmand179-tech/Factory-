"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CategoryManager } from "@/components/category-manager";
import { EmptyState } from "@/components/empty-state";
import { format } from "date-fns";

interface BladeType { id: string; nameUrdu: string; brand: string | null; sizeMm: number | null; }
interface Blade {
  id: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  condition: string;
  isActive: boolean;
  reorderPoint: number;
  bladeType: BladeType;
}

const CONDITION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "نیا", variant: "default" },
  good: { label: "اچھا", variant: "secondary" },
  worn: { label: "کمزور", variant: "destructive" },
  broken: { label: "ٹوٹا", variant: "destructive" },
};

export default function BladesModule() {
  return (
    <Tabs defaultValue="types" dir="rtl">
      <div className="mb-4">
        <h2 className="font-heading text-2xl font-bold">بلیڈ کی اقسام اور استعمال</h2>
        <p className="text-sm text-muted-foreground mt-1">
          بلیڈ کی اقسام (برانڈ، سائز) + انفرادی بلیڈز + حالت کا حساب۔
        </p>
      </div>

      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="types">بلیڈ کی اقسام</TabsTrigger>
        <TabsTrigger value="blades">انفرادی بلیڈز</TabsTrigger>
      </TabsList>

      <TabsContent value="types" className="mt-4">
        <CategoryManager
          apiBase="/api/blade-types"
          title="بلیڈ کی اقسام"
          description="بلیڈ کی قسم، برانڈ اور سائز (ملی میٹر میں)۔"
          singularName="بلیڈ کی قسم"
          addLabel="نئی قسم شامل کریں"
          emptyMessage="ابھی کوئی بلیڈ کی قسم نہیں ہے"
          extraFields={[
            { key: "brand", label: "برانڈ", type: "text", placeholder: "مثال: Bosch" },
            { key: "sizeMm", label: "سائز (ملی میٹر)", type: "number", step: 1, placeholder: "مثال: 400" },
          ]}
          renderExtra={(item) => (
            <span className="text-xs text-muted-foreground">
              {item.brand ? `• ${String(item.brand)}` : ""}
              {item.sizeMm ? ` • ${String(item.sizeMm)}mm` : ""}
            </span>
          )}
        />
      </TabsContent>

      <TabsContent value="blades" className="mt-4">
        <BladesList />
      </TabsContent>
    </Tabs>
  );
}

function BladesList() {
  const [blades, setBlades] = useState<Blade[]>([]);
  const [bladeTypes, setBladeTypes] = useState<BladeType[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bladeTypeId: "",
    serialNumber: "",
    purchaseDate: "",
    condition: "new",
    isActive: true,
    reorderPoint: "3",
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blade | null>(null);

  const fetchBlades = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blades");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBlades(data.items ?? []);
    } catch {
      toast.error("بلیڈز لوڈ نہیں ہوسکے۔");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/blade-types")
      .then((r) => r.json())
      .then((d) => setBladeTypes(d.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBlades();
  }, [fetchBlades]);

  function openAdd() {
    setEditingId(null);
    setForm({
      bladeTypeId: bladeTypes[0]?.id ?? "",
      serialNumber: "",
      purchaseDate: "",
      condition: "new",
      isActive: true,
      reorderPoint: "3",
    });
    setDialogOpen(true);
  }

  function openEdit(b: Blade) {
    setEditingId(b.id);
    setForm({
      bladeTypeId: b.bladeType?.id ?? "",
      serialNumber: b.serialNumber ?? "",
      purchaseDate: b.purchaseDate ? format(new Date(b.purchaseDate), "yyyy-MM-dd") : "",
      condition: b.condition,
      isActive: b.isActive,
      reorderPoint: String(b.reorderPoint),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.bladeTypeId) {
      toast.error("بلیڈ کی قسم منتخب کریں۔");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        bladeTypeId: form.bladeTypeId,
        serialNumber: form.serialNumber || null,
        purchaseDate: form.purchaseDate || null,
        condition: form.condition,
        isActive: form.isActive,
        reorderPoint: parseInt(form.reorderPoint) || 3,
      };
      const url = editingId ? `/api/blades/${editingId}` : "/api/blades";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "اپ ڈیٹ ہوگیا" : "نیا بلیڈ شامل ہوگیا");
      setDialogOpen(false);
      fetchBlades();
    } catch {
      toast.error("محفوظ کرنے میں مسئلہ۔");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/blades/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("بلیڈ حذف ہوگیا");
      setDeleteTarget(null);
      fetchBlades();
    } catch {
      toast.error("حذف کرنے میں مسئلہ۔");
    }
  }

  if (bladeTypes.length === 0) {
    return (
      <EmptyState
        title="پہلے بلیڈ کی قسم شامل کریں"
        message="بلیڈ شامل کرنے سے پہلے &quot;بلیڈ کی اقسام&quot; ٹیب میں کم از کم ایک قسم بنائیں۔"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg">انفرادی بلیڈز</h3>
        <Button onClick={openAdd} className="tap-target">
          <Plus className="h-4 w-4 ml-1" />
          نیا بلیڈ
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full skeleton-shimmer" />)}
        </div>
      ) : blades.length === 0 ? (
        <EmptyState
          title="ابھی کوئی بلیڈ نہیں"
          message="نیا بلیڈ شامل کرنے کے لیے بٹن پر کلک کریں۔"
          actionLabel="نیا بلیڈ"
          onAction={openAdd}
        />
      ) : (
        <ul className="space-y-2">
          {blades.map((b) => {
            const cond = CONDITION_LABELS[b.condition] ?? { label: b.condition, variant: "outline" as const };
            return (
              <li key={b.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{b.bladeType?.nameUrdu}</span>
                    <Badge variant={cond.variant}>{cond.label}</Badge>
                    {!b.isActive && <Badge variant="outline" className="text-xs">غیر فعال</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.serialNumber ? `سیریل: ${b.serialNumber}` : ""}
                    {b.purchaseDate ? ` • خرید: ${format(new Date(b.purchaseDate), "d MMM yyyy")}` : ""}
                    {` • ری آرڈر پوائنٹ: ${b.reorderPoint}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(b)} className="tap-target">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(b)} className="tap-target text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "بلیڈ میں ترمیم" : "نیا بلیڈ شامل کریں"}</DialogTitle>
            <DialogDescription>بلیڈ کی تفصیلات درج کریں۔</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>بلیڈ کی قسم *</Label>
              <Select value={form.bladeTypeId} onValueChange={(v) => setForm({ ...form, bladeTypeId: v })}>
                <SelectTrigger><SelectValue placeholder="منتخب کریں" /></SelectTrigger>
                <SelectContent>
                  {bladeTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.nameUrdu} {t.brand ? `(${t.brand})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>سیریل نمبر</Label>
                <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>خرید کی تاریخ</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>حالت</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">نیا</SelectItem>
                    <SelectItem value="good">اچھا</SelectItem>
                    <SelectItem value="worn">کمزور</SelectItem>
                    <SelectItem value="broken">ٹوٹا</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ری آرڈر پوائنٹ</Label>
                <Input type="number" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} dir="ltr" className="numeric-input" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>منسوخ</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">بلیڈ حذف کریں؟</AlertDialogTitle>
            <AlertDialogDescription>کیا واقعی یہ بلیڈ حذف کرنا ہے؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف کریں</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
