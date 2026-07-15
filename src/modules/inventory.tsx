"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { format } from "date-fns";

interface MarbleType { id: string; nameUrdu: string; }
interface MarbleSize { id: string; label: string; }
interface MarbleThickness { id: string; label: string; }

interface InventoryItem {
  id: string;
  date: string;
  type: string;
  marbleTypeId: string | null;
  sizeId: string | null;
  thicknessId: string | null;
  quantity: number;
  weightTons: number | null;
  notes: string | null;
  marbleType: MarbleType | null;
  size: MarbleSize | null;
  thickness: MarbleThickness | null;
}

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "outline" }> = {
  raw_rock_in: { label: "کچا پتھر داخل", icon: ArrowDownToLine, variant: "default" },
  slab_out: { label: "تیار سلیب خارج", icon: ArrowUpFromLine, variant: "secondary" },
  adjustment: { label: "ایڈجسٹمنٹ", icon: SlidersHorizontal, variant: "outline" },
};

export default function InventoryModule() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [marbleTypes, setMarbleTypes] = useState<MarbleType[]>([]);
  const [sizes, setSizes] = useState<MarbleSize[]>([]);
  const [thicknesses, setThicknesses] = useState<MarbleThickness[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "raw_rock_in" as keyof typeof TYPE_META,
    marbleTypeId: "",
    sizeId: "",
    thicknessId: "",
    quantity: "",
    weightTons: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (filterType !== "all") params.set("type", filterType);
      const res = await fetch(`/api/inventory?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      toast.error("انوینٹری لوڈ نہیں ہوسکی۔");
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    Promise.all([
      fetch("/api/marble-types").then((r) => r.json()),
      fetch("/api/marble-sizes").then((r) => r.json()),
      fetch("/api/marble-thicknesses").then((r) => r.json()),
    ])
      .then(([mt, sz, th]) => {
        setMarbleTypes(mt.items ?? []);
        setSizes(sz.items ?? []);
        setThicknesses(th.items ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function openAdd() {
    setEditingId(null);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      type: "raw_rock_in",
      marbleTypeId: "",
      sizeId: "",
      thicknessId: "",
      quantity: "",
      weightTons: "",
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      date: format(new Date(item.date), "yyyy-MM-dd"),
      type: item.type,
      marbleTypeId: item.marbleTypeId ?? "",
      sizeId: item.sizeId ?? "",
      thicknessId: item.thicknessId ?? "",
      quantity: String(item.quantity),
      weightTons: item.weightTons ? String(item.weightTons) : "",
      notes: item.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.date || !form.type || !form.quantity) {
      toast.error("تاریخ، قسم اور مقدار ضروری ہیں۔");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        type: form.type,
        marbleTypeId: form.marbleTypeId || null,
        sizeId: form.sizeId || null,
        thicknessId: form.thicknessId || null,
        quantity: parseFloat(form.quantity),
        weightTons: form.weightTons ? parseFloat(form.weightTons) : null,
        notes: form.notes || null,
      };
      const url = editingId ? `/api/inventory/${editingId}` : "/api/inventory";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "اپ ڈیٹ ہوگیا" : "نیا انوینٹری ریکارڈ شامل ہوگیا");
      setDialogOpen(false);
      fetchItems();
    } catch {
      toast.error("محفوظ کرنے میں مسئلہ۔");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/inventory/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("ریکارڈ حذف ہوگیا");
      setDeleteTarget(null);
      fetchItems();
    } catch {
      toast.error("حذف کرنے میں مسئلہ۔");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">ذخیرہ / انوینٹری</h2>
          <p className="text-sm text-muted-foreground mt-1">
            کچا پتھر داخل، تیار سلیب خارج، اور ایڈجسٹمنٹ — کٹنگ ریکارڈ سے منسلک۔
          </p>
        </div>
        <Button onClick={openAdd} className="tap-target">
          <Plus className="h-4 w-4 ml-1" />
          نیا ریکارڈ
        </Button>
      </div>

      <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
        <SelectTrigger className="max-w-[260px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">تمام اقسام</SelectItem>
          <SelectItem value="raw_rock_in">کچا پتھر داخل</SelectItem>
          <SelectItem value="slab_out">تیار سلیب خارج</SelectItem>
          <SelectItem value="adjustment">ایڈجسٹمنٹ</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full skeleton-shimmer" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="ابھی کوئی انوینٹری ریکارڈ نہیں"
          message="نیا ریکارڈ شامل کرنے کے لیے بٹن پر کلک کریں۔"
          actionLabel="نیا ریکارڈ"
          onAction={openAdd}
        />
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((item) => {
              const meta = TYPE_META[item.type] ?? { label: item.type, icon: SlidersHorizontal, variant: "outline" as const };
              const Icon = meta.icon;
              return (
                <li key={item.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className="h-4 w-4 text-primary" />
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        {item.marbleType && <span className="font-medium">{item.marbleType.nameUrdu}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(item.date), "d MMM yyyy")} • مقدار: {item.quantity}
                        {item.weightTons ? ` • وزن: ${item.weightTons} ٹن` : ""}
                      </p>
                      {item.size && item.thickness && (
                        <p className="text-xs text-muted-foreground">
                          سائز: {item.size.label} • موٹائی: {item.thickness.label}
                        </p>
                      )}
                      {item.notes && <p className="text-xs italic text-muted-foreground mt-0.5">{item.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="tap-target">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(item)} className="tap-target text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2" dir="rtl">
              <p className="text-sm text-muted-foreground">کل {total} میں سے {((page - 1) * 15) + 1}-{Math.min(page * 15, total)}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>السابق</Button>
                <span className="inline-flex items-center px-3 text-sm font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>التالی</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "انوینٹری میں ترمیم" : "نیا انوینٹری ریکارڈ"}</DialogTitle>
            <DialogDescription>ذخیرے کی تفصیلات درج کریں۔</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاریخ *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>قسم *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as keyof typeof TYPE_META })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_rock_in">کچا پتھر داخل</SelectItem>
                    <SelectItem value="slab_out">تیار سلیب خارج</SelectItem>
                    <SelectItem value="adjustment">ایڈجسٹمنٹ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>پتھر کی قسم (اختیاری)</Label>
              <Select value={form.marbleTypeId || "__none__"} onValueChange={(v) => setForm({ ...form, marbleTypeId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="کوئی نہیں" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— کوئی نہیں —</SelectItem>
                  {marbleTypes.map((m) => <SelectItem key={m.id} value={m.id}>{m.nameUrdu}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>سائز (اختیاری)</Label>
                <Select value={form.sizeId || "__none__"} onValueChange={(v) => setForm({ ...form, sizeId: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="کوئی نہیں" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— کوئی نہیں —</SelectItem>
                    {sizes.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>موٹائی (اختیاری)</Label>
                <Select value={form.thicknessId || "__none__"} onValueChange={(v) => setForm({ ...form, thicknessId: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="کوئی نہیں" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— کوئی نہیں —</SelectItem>
                    {thicknesses.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>مقدار *</Label>
                <Input type="number" step="0.001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} dir="ltr" className="numeric-input" />
              </div>
              <div className="space-y-2">
                <Label>وزن (ٹن)</Label>
                <Input type="number" step="0.001" value={form.weightTons} onChange={(e) => setForm({ ...form, weightTons: e.target.value })} dir="ltr" className="numeric-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>نوٹس</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} dir="rtl" />
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
            <AlertDialogTitle className="font-heading">ریکارڈ حذف کریں؟</AlertDialogTitle>
            <AlertDialogDescription>کیا واقعی یہ انوینٹری ریکارڈ حذف کرنا ہے؟</AlertDialogDescription>
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
