"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CategoryManager } from "@/components/category-manager";
import { EmptyState } from "@/components/empty-state";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";

interface FoodCategory { id: string; nameUrdu: string; }
interface FoodExpense {
  id: string;
  date: string;
  categoryId: string;
  itemName: string;
  quantity: number;
  unit: string;
  cost: number;
  notes: string | null;
  category: FoodCategory;
}

const COMMON_UNITS = ["kg", "litre", "gram", "piece", "dozen", "packet", "bag"];

export default function FoodExpensesModule() {
  return (
    <Tabs defaultValue="expenses" dir="rtl">
      <div className="mb-4">
        <h2 className="font-heading text-2xl font-bold">کھانے کا خرچہ</h2>
        <p className="text-sm text-muted-foreground mt-1">
          ناشتہ، دوپہر کا کھانا، چائے، سبزیاں، تیل/گھی — تاریخ، آئٹم، مقدار اور قیمت کے ساتھ۔
        </p>
      </div>

      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="expenses">خرچہ ریکارڈ</TabsTrigger>
        <TabsTrigger value="categories">اقسام</TabsTrigger>
      </TabsList>

      <TabsContent value="expenses" className="mt-4">
        <ExpensesList />
      </TabsContent>

      <TabsContent value="categories" className="mt-4">
        <CategoryManager
          apiBase="/api/food-categories"
          title="کھانے کی اقسام"
          description="خرچے کی مختلف اقسام — ناشتہ، دوپہر کا کھانا، چائے وغیرہ۔"
          singularName="قسم"
          addLabel="نئی قسم شامل کریں"
          emptyMessage="ابھی کوئی قسم نہیں ہے"
        />
      </TabsContent>
    </Tabs>
  );
}

function ExpensesList() {
  const [expenses, setExpenses] = useState<FoodExpense[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    categoryId: "",
    itemName: "",
    quantity: "",
    unit: "kg",
    cost: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FoodExpense | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15", search: debouncedSearch });
      const res = await fetch(`/api/food-expenses?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExpenses(data.items ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      toast.error("خرچہ ریکارڈ لوڈ نہیں ہوسکے۔");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetch("/api/food-categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  function openAdd() {
    setEditingId(null);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      categoryId: categories[0]?.id ?? "",
      itemName: "",
      quantity: "",
      unit: "kg",
      cost: "",
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEdit(e: FoodExpense) {
    setEditingId(e.id);
    setForm({
      date: format(new Date(e.date), "yyyy-MM-dd"),
      categoryId: e.categoryId,
      itemName: e.itemName,
      quantity: String(e.quantity),
      unit: e.unit,
      cost: String(e.cost),
      notes: e.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.date || !form.categoryId || !form.itemName.trim() || !form.quantity || !form.unit || !form.cost) {
      toast.error("تمام ضروری فیلڈز بھریں۔");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        categoryId: form.categoryId,
        itemName: form.itemName.trim(),
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        cost: parseFloat(form.cost),
        notes: form.notes || null,
      };
      const url = editingId ? `/api/food-expenses/${editingId}` : "/api/food-expenses";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "اپ ڈیٹ ہوگیا" : "نیا خرچہ شامل ہوگیا");
      setDialogOpen(false);
      fetchExpenses();
    } catch {
      toast.error("محفوظ کرنے میں مسئلہ۔");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/food-expenses/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("خرچہ حذف ہوگیا");
      setDeleteTarget(null);
      fetchExpenses();
    } catch {
      toast.error("حذف کرنے میں مسئلہ۔");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="آئٹم یا نوٹس میں تلاش کریں..."
          dir="rtl"
          className="flex-1"
        />
        <Button onClick={openAdd} className="tap-target" disabled={categories.length === 0}>
          <Plus className="h-4 w-4 ml-1" />
          نیا خرچہ
        </Button>
      </div>

      {categories.length === 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-3 text-sm">
          تنبیہ: پہلے &quot;اقسام&quot; ٹیب میں کم از کم ایک قسم شامل کریں۔
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full skeleton-shimmer" />)}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          title="ابھی کوئی خرچہ نہیں ہے"
          message="نیا خرچہ شامل کرنے کے لیے بٹن پر کلک کریں۔"
          actionLabel="نیا خرچہ"
          onAction={openAdd}
        />
      ) : (
        <>
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li key={e.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{e.itemName}</span>
                      <Badge variant="secondary" className="text-xs">{e.category?.nameUrdu}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(e.date), "d MMM yyyy")} • {e.quantity} {e.unit}
                    </p>
                    {e.notes && <p className="text-xs italic text-muted-foreground mt-0.5">{e.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-medium numeric-input">₨ {e.cost.toLocaleString("ur-PK")}</p>
                    <Button variant="outline" size="sm" onClick={() => openEdit(e)} className="tap-target">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteTarget(e)} className="tap-target text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
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
            <DialogTitle className="font-heading">{editingId ? "خرچہ میں ترمیم" : "نیا خرچہ شامل کریں"}</DialogTitle>
            <DialogDescription>کھانے کے خرچے کی تفصیلات درج کریں۔</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاریخ *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>قسم *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="منتخب کریں" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameUrdu}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>آئٹم کا نام *</Label>
              <Input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} dir="rtl" placeholder="مثال: چاول" autoFocus />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>مقدار *</Label>
                <Input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} dir="ltr" className="numeric-input" />
              </div>
              <div className="space-y-2">
                <Label>اکائی *</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMMON_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>قیمت (روپے) *</Label>
                <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} dir="ltr" className="numeric-input" />
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
            <AlertDialogTitle className="font-heading">خرچہ حذف کریں؟</AlertDialogTitle>
            <AlertDialogDescription>کیا واقعی &quot;{deleteTarget?.itemName}&quot; حذف کرنا ہے؟</AlertDialogDescription>
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
