"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { EmptyState } from "./empty-state";

export interface CategoryItem {
  id: string;
  nameUrdu: string;
  isActive: boolean;
  sortOrder: number;
  [key: string]: unknown;
}

export interface CategoryField {
  key: string;
  label: string;
  type: "text" | "number" | "textarea";
  placeholder?: string;
  required?: boolean;
  /** For number fields */
  step?: number;
}

export interface CategoryManagerProps {
  /** API endpoint base, e.g. "/api/marble-types" */
  apiBase: string;
  /** Title shown at top, e.g. "پتھر کی اقسام" */
  title: string;
  /** Description / help text */
  description?: string;
  /** Label for the add button */
  addLabel?: string;
  /** Singular name for dialog title, e.g. "پتھر کی قسم" */
  singularName: string;
  /** Extra fields beyond nameUrdu, isActive, sortOrder */
  extraFields?: CategoryField[];
  /** Render extra badges or info per row */
  renderExtra?: (item: CategoryItem) => React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
}

export function CategoryManager({
  apiBase,
  title,
  description,
  addLabel = "نیا شامل کریں",
  singularName,
  extraFields = [],
  renderExtra,
  emptyMessage,
}: CategoryManagerProps) {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ nameUrdu: "" });
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}?search=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setItems(data.items ?? data);
    } catch (err) {
      toast.error("ڈیٹا لوڈ نہیں ہوسکا۔ انٹرنیٹ کنکشن چیک کریں۔");
    } finally {
      setLoading(false);
    }
  }, [apiBase, debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function openAdd() {
    setEditingId(null);
    const initial: Record<string, string> = { nameUrdu: "" };
    extraFields.forEach((f) => (initial[f.key] = ""));
    setForm(initial);
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(item: CategoryItem) {
    setEditingId(item.id);
    const next: Record<string, string> = { nameUrdu: item.nameUrdu };
    extraFields.forEach((f) => (next[f.key] = String(item[f.key] ?? "")));
    setForm(next);
    setIsActive(item.isActive);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nameUrdu.trim()) {
      toast.error("نام درج کریں");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nameUrdu: form.nameUrdu.trim(),
        isActive,
      };
      extraFields.forEach((f) => {
        if (f.type === "number") {
          const v = parseFloat(form[f.key]);
          payload[f.key] = Number.isFinite(v) ? v : null;
        } else {
          payload[f.key] = form[f.key]?.trim() || null;
        }
      });

      const url = editingId ? `${apiBase}/${editingId}` : apiBase;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      toast.success(editingId ? "تبدیلیاں محفوظ ہوگئیں" : "نیا آئٹم شامل ہوگیا");
      setDialogOpen(false);
      fetchItems();
    } catch {
      toast.error("محفوظ کرنے میں مسئلہ۔ دوبارہ کوشش کریں۔");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      toast.success("آئٹم حذف ہوگیا");
      setDeleteTarget(null);
      fetchItems();
    } catch {
      toast.error("حذف کرنے میں مسئلہ۔");
    } finally {
      setDeleting(false);
    }
  }

  async function moveItem(item: CategoryItem, direction: "up" | "down") {
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((i) => i.id === item.id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const swapItem = sorted[swapIdx];

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === item.id) return { ...i, sortOrder: swapItem.sortOrder };
        if (i.id === swapItem.id) return { ...i, sortOrder: item.sortOrder };
        return i;
      })
    );

    // Persist both
    try {
      await Promise.all([
        fetch(`${apiBase}/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: swapItem.sortOrder }),
        }),
        fetch(`${apiBase}/${swapItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: item.sortOrder }),
        }),
      ]);
    } catch {
      toast.error("ترتیب تبدیل نہیں ہوئی");
      fetchItems();
    }
  }

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <Button onClick={openAdd} className="tap-target">
          <Plus className="h-4 w-4 ml-1" />
          {addLabel}
        </Button>
      </div>

      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="تلاش کریں..."
        dir="rtl"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full skeleton-shimmer" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={emptyMessage ?? `${title} خالی ہے`}
          message="نیا آئٹم شامل کرنے کے لیے نیچے دیے گئے بٹن پر کلک کریں۔"
          actionLabel={addLabel}
          onAction={openAdd}
        />
      ) : (
        <ul className="space-y-2">
          {sorted.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => moveItem(item, "up")}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                  aria-label="اوپر کریں"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveItem(item, "down")}
                  disabled={index === sorted.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                  aria-label="نیچے کریں"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <GripVertical className="h-4 w-4 text-muted-foreground/40" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{item.nameUrdu}</span>
                  {!item.isActive && (
                    <Badge variant="secondary" className="text-xs">غیر فعال</Badge>
                  )}
                  {renderExtra?.(item)}
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(item)}
                  className="tap-target"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  className="tap-target text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingId ? `${singularName} میں ترمیم` : `نیا ${singularName} شامل کریں`}
            </DialogTitle>
            <DialogDescription>
              درج ذیل معلومات فراہم کریں۔
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nameUrdu">نام (اردو) *</Label>
              <Input
                id="nameUrdu"
                value={form.nameUrdu || ""}
                onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })}
                dir="rtl"
                autoFocus
              />
            </div>

            {extraFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && " *"}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    dir="rtl"
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === "number" ? "number" : "text"}
                    step={field.step}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    dir={field.type === "number" ? "ltr" : "rtl"}
                    className={field.type === "number" ? "numeric-input" : ""}
                  />
                )}
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="isActive">فعال حالت</Label>
                <p className="text-xs text-muted-foreground">غیر فعال آئٹمز نئے ریکارڈز میں نظر نہیں آئیں گے</p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
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
            <AlertDialogTitle className="font-heading">حذف کریں؟</AlertDialogTitle>
            <AlertDialogDescription>
              کیا آپ واقعی &quot;{deleteTarget?.nameUrdu}&quot; کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہوگا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "حذف ہو رہا ہے..." : "حذف کریں"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
