"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { EmptyState } from "@/components/empty-state";
import { calculateSlabWeight, formatWeight, getUnitLabelUrdu, type LengthUnit } from "@/lib/weight-calc";
import { format } from "date-fns";

interface MarbleType { id: string; nameUrdu: string; }
interface MarbleSize { id: string; label: string; lengthFt: number; widthFt: number; }
interface MarbleThickness { id: string; label: string; thicknessCm: number; }
interface Blade { id: string; serialNumber: string | null; bladeType: { nameUrdu: string; }; }

interface CuttingRecord {
  id: string;
  date: string;
  marbleTypeId: string;
  sizeId: string;
  thicknessId: string;
  lengthUnit: string;
  calculatedWeight: number | null;
  actualWeight: number | null;
  bladeId: string | null;
  notes: string | null;
  marbleType: MarbleType;
  size: MarbleSize;
  thickness: MarbleThickness;
  blade: Blade | null;
}

export default function CuttingRecordsModule() {
  const [records, setRecords] = useState<CuttingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CuttingRecord | null>(null);

  // Reference data (cached client-side - stale-while-revalidate pattern)
  const [marbleTypes, setMarbleTypes] = useState<MarbleType[]>([]);
  const [sizes, setSizes] = useState<MarbleSize[]>([]);
  const [thicknesses, setThicknesses] = useState<MarbleThickness[]>([]);
  const [blades, setBlades] = useState<Blade[]>([]);

  // Form state
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    marbleTypeId: "",
    sizeId: "",
    thicknessId: "",
    lengthUnit: "ft" as LengthUnit,
    calculatedWeight: "",
    actualWeight: "",
    bladeId: "",
    notes: "",
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
        search: debouncedSearch,
      });
      const res = await fetch(`/api/cutting-records?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setRecords(data.items ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      toast.error("کٹنگ ریکارڈ لوڈ نہیں ہوسکے۔");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  // Fetch reference data once (stale-while-revalidate)
  useEffect(() => {
    let cancelled = false;
    async function loadRef() {
      try {
        const [mt, sz, th, bl] = await Promise.all([
          fetch("/api/marble-types").then((r) => r.json()),
          fetch("/api/marble-sizes").then((r) => r.json()),
          fetch("/api/marble-thicknesses").then((r) => r.json()),
          fetch("/api/blades").then((r) => r.json()),
        ]);
        if (!cancelled) {
          setMarbleTypes(mt.items ?? []);
          setSizes(sz.items ?? []);
          setThicknesses(th.items ?? []);
          setBlades(bl.items ?? []);
        }
      } catch {
        // silent - toast handled by individual fetches
      }
    }
    loadRef();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Auto-calculate suggested weight when size, thickness, or unit changes
  useEffect(() => {
    if (!form.sizeId || !form.thicknessId) return;
    const size = sizes.find((s) => s.id === form.sizeId);
    const thickness = thicknesses.find((t) => t.id === form.thicknessId);
    if (!size || !thickness) return;

    // size.lengthFt / widthFt are stored in feet; convert based on selected unit
    // For simplicity, we use the stored feet values directly since size is stored in ft
    const weight = calculateSlabWeight(
      size.lengthFt,
      size.widthFt,
      thickness.thicknessCm,
      "ft", // always use ft since sizes are stored in feet
      2.7
    );
    setForm((prev) => ({
      ...prev,
      calculatedWeight: weight.toFixed(3),
      actualWeight: prev.actualWeight || weight.toFixed(3),
    }));
  }, [form.sizeId, form.thicknessId, sizes, thicknesses]);

  function openAdd() {
    setEditingId(null);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      marbleTypeId: marbleTypes[0]?.id ?? "",
      sizeId: sizes[0]?.id ?? "",
      thicknessId: thicknesses[0]?.id ?? "",
      lengthUnit: "ft",
      calculatedWeight: "",
      actualWeight: "",
      bladeId: "",
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEdit(rec: CuttingRecord) {
    setEditingId(rec.id);
    setForm({
      date: format(new Date(rec.date), "yyyy-MM-dd"),
      marbleTypeId: rec.marbleTypeId,
      sizeId: rec.sizeId,
      thicknessId: rec.thicknessId,
      lengthUnit: rec.lengthUnit as LengthUnit,
      calculatedWeight: rec.calculatedWeight?.toString() ?? "",
      actualWeight: rec.actualWeight?.toString() ?? "",
      bladeId: rec.bladeId ?? "",
      notes: rec.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.date || !form.marbleTypeId || !form.sizeId || !form.thicknessId) {
      toast.error("تاریخ، پتھر کی قسم، سائز اور موٹائی ضروری ہیں۔");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        marbleTypeId: form.marbleTypeId,
        sizeId: form.sizeId,
        thicknessId: form.thicknessId,
        lengthUnit: form.lengthUnit,
        calculatedWeight: form.calculatedWeight ? parseFloat(form.calculatedWeight) : null,
        actualWeight: form.actualWeight ? parseFloat(form.actualWeight) : null,
        bladeId: form.bladeId || null,
        notes: form.notes || null,
      };

      const url = editingId ? `/api/cutting-records/${editingId}` : "/api/cutting-records";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("save failed");

      toast.success(editingId ? "ریکارڈ اپ ڈیٹ ہوگیا" : "نیا کٹنگ ریکارڈ شامل ہوگیا");
      setDialogOpen(false);
      fetchRecords();
    } catch {
      toast.error("محفوظ کرنے میں مسئلہ۔ انٹرنیٹ کنکشن چیک کریں۔");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/cutting-records/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      toast.success("ریکارڈ حذف ہوگیا");
      setDeleteTarget(null);
      fetchRecords();
    } catch {
      toast.error("حذف کرنے میں مسئلہ۔");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">کٹنگ ریکارڈ</h2>
          <p className="text-sm text-muted-foreground mt-1">
            ماربل کٹنگ کا مرکزی ریکارڈ — تاریخ، قسم، سائز، وزن، بلیڈ اور نوٹس۔
          </p>
        </div>
        <Button onClick={openAdd} className="tap-target" disabled={marbleTypes.length === 0 || sizes.length === 0 || thicknesses.length === 0}>
          <Plus className="h-4 w-4 ml-1" />
          نیا ریکارڈ
        </Button>
      </div>

      {(marbleTypes.length === 0 || sizes.length === 0 || thicknesses.length === 0) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-3 text-sm">
          تنبیہ: پہلے پتھر کی اقسام، سائز اور موٹائی شامل کریں، تبھی نیا کٹنگ ریکارڈ بنایا جا سکتا ہے۔
        </div>
      )}

      <Input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="تلاش کریں — پتھر کی قسم، سائز، نوٹس..."
        dir="rtl"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full skeleton-shimmer" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          title="ابھی کوئی کٹنگ ریکارڈ نہیں"
          message="نیا کٹنگ ریکارڈ شامل کرنے کے لیے &quot;نیا ریکارڈ&quot; پر کلک کریں۔"
          actionLabel="نیا ریکارڈ"
          onAction={openAdd}
        />
      ) : (
        <>
          <ul className="space-y-2">
            {records.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{r.marbleType?.nameUrdu ?? "—"}</span>
                      <Badge variant="secondary" className="text-xs">{r.size?.label}</Badge>
                      <Badge variant="outline" className="text-xs">{r.thickness?.label}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{format(new Date(r.date), "d MMM yyyy")}</span>
                      <span>•</span>
                      <span className="numeric-input">وزن: {formatWeight(r.actualWeight ?? r.calculatedWeight)}</span>
                      {r.blade && (
                        <>
                          <span>•</span>
                          <span>بلیڈ: {r.blade.bladeType?.nameUrdu}{r.blade.serialNumber ? ` (${r.blade.serialNumber})` : ""}</span>
                        </>
                      )}
                    </div>
                    {r.notes && (
                      <p className="mt-1 text-xs text-muted-foreground italic">{r.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(r)} className="tap-target">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(r)}
                      className="tap-target text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2" dir="rtl">
              <p className="text-sm text-muted-foreground">
                کل {total} میں سے {((page - 1) * 15) + 1}-{Math.min(page * 15, total)}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  السابق
                </Button>
                <span className="inline-flex items-center px-3 text-sm font-medium">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  التالی
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingId ? "کٹنگ ریکارڈ میں ترمیم" : "نیا کٹنگ ریکارڈ"}
            </DialogTitle>
            <DialogDescription>کٹنگ کی تفصیلات درج کریں۔</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاریخ *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>پیمانہ</Label>
                <Select
                  value={form.lengthUnit}
                  onValueChange={(v) => setForm({ ...form, lengthUnit: v as LengthUnit })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ft">فٹ (default)</SelectItem>
                    <SelectItem value="m">میٹر</SelectItem>
                    <SelectItem value="in">انچ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>پتھر کی قسم *</Label>
              <Select
                value={form.marbleTypeId}
                onValueChange={(v) => setForm({ ...form, marbleTypeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  {marbleTypes.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nameUrdu}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>سائز *</Label>
                <Select
                  value={form.sizeId}
                  onValueChange={(v) => setForm({ ...form, sizeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label} ({s.lengthFt}×{s.widthFt} فٹ)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>موٹائی *</Label>
                <Select
                  value={form.thicknessId}
                  onValueChange={(v) => setForm({ ...form, thicknessId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {thicknesses.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label} ({t.thicknessCm}cm)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto-calculated weight suggestion */}
            {form.calculatedWeight && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-medium">تخمینی وزن (خودکار حساب)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  size × thickness × density (2.7 tons/m³) = <span className="numeric-input font-semibold">{form.calculatedWeight}</span> ٹن
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>اصل وزن (ٹن)</Label>
              <Input
                type="number"
                step="0.001"
                value={form.actualWeight}
                onChange={(e) => setForm({ ...form, actualWeight: e.target.value })}
                placeholder="اصل weight درج کریں یا تخمینہ استعمال کریں"
                dir="ltr"
                className="numeric-input text-right"
              />
              <p className="text-xs text-muted-foreground">
                اگر اصل weight نہیں پتہ، تو تخمینی weight استعمال کریں۔
              </p>
            </div>

            <div className="space-y-2">
              <Label>بلیڈ (اختیاری)</Label>
              <Select
                value={form.bladeId || "__none__"}
                onValueChange={(v) => setForm({ ...form, bladeId: v === "__none__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="کوئی بلیڈ منتخب نہیں" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— کوئی نہیں —</SelectItem>
                  {blades.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bladeType?.nameUrdu}{b.serialNumber ? ` (${b.serialNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوٹس</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="اضافی معلومات..."
                dir="rtl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              منسوخ
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">ریکارڈ حذف کریں؟</AlertDialogTitle>
            <AlertDialogDescription>
              کیا واقعی یہ کٹنگ ریکارڈ حذف کرنا ہے؟ یہ عمل واپس نہیں ہوگا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
