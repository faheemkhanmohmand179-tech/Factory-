"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CategoryManager } from "@/components/category-manager";
import { EmptyState } from "@/components/empty-state";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";

interface Designation { id: string; nameUrdu: string; }
interface Staff {
  id: string;
  nameUrdu: string;
  designationId: string;
  phone: string | null;
  isActive: boolean;
  designation: Designation;
}
interface Attendance {
  id: string;
  staffId: string;
  date: string;
  status: string;
  notes: string | null;
  staff: { id: string; nameUrdu: string; designation: Designation };
}

export default function StaffModule() {
  return (
    <Tabs defaultValue="designations" dir="rtl">
      <div className="mb-4">
        <h2 className="font-heading text-2xl font-bold">عملہ اور عہدے</h2>
        <p className="text-sm text-muted-foreground mt-1">
          عہدے (Designations) → عملہ (Staff) → روزگنڈ کا حساب (Attendance)۔
        </p>
      </div>

      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="designations">عہدے</TabsTrigger>
        <TabsTrigger value="staff">عملہ</TabsTrigger>
        <TabsTrigger value="attendance">حاضری</TabsTrigger>
      </TabsList>

      <TabsContent value="designations" className="mt-4">
        <CategoryManager
          apiBase="/api/designations"
          title="عہدے"
          description="فیکٹری کے مختلف عہدے — منیجر، سپروائزر، مزدور، اکاؤنٹنٹ وغیرہ۔"
          singularName="عہدہ"
          addLabel="نیا عہدہ شامل کریں"
          emptyMessage="ابھی کوئی عہدہ نہیں ہے"
        />
      </TabsContent>

      <TabsContent value="staff" className="mt-4">
        <StaffList />
      </TabsContent>

      <TabsContent value="attendance" className="mt-4">
        <AttendanceList />
      </TabsContent>
    </Tabs>
  );
}

function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nameUrdu: "", designationId: "", phone: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff?search=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStaff(data.items ?? []);
    } catch {
      toast.error("عملہ کی فہرست لوڈ نہیں ہوئی۔");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetch("/api/designations")
      .then((r) => r.json())
      .then((d) => setDesignations(d.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  function openAdd() {
    setEditingId(null);
    setForm({ nameUrdu: "", designationId: designations[0]?.id ?? "", phone: "", isActive: true });
    setDialogOpen(true);
  }

  function openEdit(s: Staff) {
    setEditingId(s.id);
    setForm({ nameUrdu: s.nameUrdu, designationId: s.designationId, phone: s.phone ?? "", isActive: s.isActive });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nameUrdu.trim() || !form.designationId) {
      toast.error("نام اور عہدہ ضروری ہیں۔");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, nameUrdu: form.nameUrdu.trim() };
      const url = editingId ? `/api/staff/${editingId}` : "/api/staff";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "اپ ڈیٹ ہوگیا" : "نیا عملہ شامل ہوگیا");
      setDialogOpen(false);
      fetchStaff();
    } catch {
      toast.error("محفوظ کرنے میں مسئلہ۔");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/staff/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("عملہ حذف ہوگیا");
      setDeleteTarget(null);
      fetchStaff();
    } catch {
      toast.error("حذف کرنے میں مسئلہ۔");
    }
  }

  if (designations.length === 0) {
    return (
      <EmptyState
        title="پہلے عہدے شامل کریں"
        message="عملہ شامل کرنے سے پہلے &quot;عہدے&quot; ٹیب میں کم از کم ایک عہدہ بنائیں۔"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="نام سے تلاش کریں..."
          dir="rtl"
          className="flex-1"
        />
        <Button onClick={openAdd} className="tap-target">
          <Plus className="h-4 w-4 ml-1" />
          نیا عملہ
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full skeleton-shimmer" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <EmptyState
          title="ابھی کوئی عملہ نہیں ہے"
          message="نیا عملہ شامل کرنے کے لیے &quot;نیا عملہ&quot; پر کلک کریں۔"
          actionLabel="نیا عملہ"
          onAction={openAdd}
        />
      ) : (
        <ul className="space-y-2">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{s.nameUrdu}</span>
                  <Badge variant="secondary" className="text-xs">{s.designation?.nameUrdu}</Badge>
                  {!s.isActive && <Badge variant="outline" className="text-xs">غیر فعال</Badge>}
                </div>
                {s.phone && <p className="text-xs text-muted-foreground mt-0.5">فون: {s.phone}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)} className="tap-target">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(s)} className="tap-target text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingId ? "عملہ میں ترمیم" : "نیا عملہ شامل کریں"}
            </DialogTitle>
            <DialogDescription>عملے کی معلومات درج کریں۔</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نام *</Label>
              <Input value={form.nameUrdu} onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })} dir="rtl" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>عہدہ *</Label>
              <Select value={form.designationId} onValueChange={(v) => setForm({ ...form, designationId: v })}>
                <SelectTrigger><SelectValue placeholder="منتخب کریں" /></SelectTrigger>
                <SelectContent>
                  {designations.map((d) => <SelectItem key={d.id} value={d.id}>{d.nameUrdu}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>فون (اختیاری)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" placeholder="03xx-xxxxxxx" />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
              <div>
                <Label>فعال حالت</Label>
                <p className="text-xs text-muted-foreground">غیر فعال عملہ حاضری میں نظر نہیں آئے گا</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
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
            <AlertDialogTitle className="font-heading">عملہ حذف کریں؟</AlertDialogTitle>
            <AlertDialogDescription>کیا واقعی &quot;{deleteTarget?.nameUrdu}&quot; کو حذف کرنا ہے؟</AlertDialogDescription>
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

function AttendanceList() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ staffId: "", status: "present", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff-attendance?date=${date}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecords(data.items ?? []);
    } catch {
      toast.error("حاضری لوڈ نہیں ہوئی۔");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) => setStaff(d.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  async function handleSave() {
    if (!form.staffId) {
      toast.error("عملہ منتخب کریں۔");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date }),
      });
      if (!res.ok) throw new Error();
      toast.success("حاضری محفوظ ہوگئی");
      setDialogOpen(false);
      setForm({ staffId: "", status: "present", notes: "" });
      fetchRecords();
    } catch {
      toast.error("محفوظ کرنے میں مسئلہ۔");
    } finally {
      setSaving(false);
    }
  }

  const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    present: { label: "حاضر", variant: "default" },
    absent: { label: "غیر حاضر", variant: "destructive" },
    half_day: { label: "نصف دن", variant: "secondary" },
    leave: { label: "چھٹی", variant: "outline" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" className="max-w-[180px]" />
        <Button onClick={() => { setForm({ staffId: staff[0]?.id ?? "", status: "present", notes: "" }); setDialogOpen(true); }} className="tap-target" disabled={staff.length === 0}>
          <Plus className="h-4 w-4 ml-1" />
          حاضری شامل کریں
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full skeleton-shimmer" />)}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          title="اس تاریخ کو کوئی حاضری نہیں"
          message="نیا حاضری ریکارڈ شامل کرنے کے لیے بٹن پر کلک کریں۔"
          icon={<CalendarCheck className="h-7 w-7 text-muted-foreground" />}
        />
      ) : (
        <ul className="space-y-2">
          {records.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="min-w-0">
                <p className="font-medium">{a.staff?.nameUrdu}</p>
                <p className="text-xs text-muted-foreground">{a.staff?.designation?.nameUrdu} • {format(new Date(a.date), "d MMM yyyy")}</p>
                {a.notes && <p className="text-xs italic text-muted-foreground mt-0.5">{a.notes}</p>}
              </div>
              <Badge variant={statusBadge[a.status]?.variant ?? "outline"}>
                {statusBadge[a.status]?.label ?? a.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">حاضری شامل کریں — {format(new Date(date), "d MMM yyyy")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>عملہ *</Label>
              <Select value={form.staffId} onValueChange={(v) => setForm({ ...form, staffId: v })}>
                <SelectTrigger><SelectValue placeholder="منتخب کریں" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.nameUrdu} ({s.designation?.nameUrdu})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>حالت *</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="absent">غیر حاضر</SelectItem>
                  <SelectItem value="half_day">نصف دن</SelectItem>
                  <SelectItem value="leave">چھٹی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>نوٹس</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>منسوخ</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
