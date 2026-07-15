"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mountain, User, Ruler, Save, Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

export default function SettingsModule() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [factoryName, setFactoryName] = useState("");
  const [founders, setFounders] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("ft");
  const [density, setDensity] = useState("2.7");
  const [language, setLanguage] = useState("ur");

  // Track the active theme choice locally so the radio-like UI can render
  // before next-themes hydrates on the client.
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("light");

  useEffect(() => {
    // Sync local UI with next-themes once mounted. This is the recommended
    // pattern for hydrating client-only state (the theme value comes from
    // localStorage, so we can't know it on the server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (theme) setThemeChoice(theme as ThemeChoice);
  }, [theme]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        setFactoryName(d.factory_name ?? "المکہ فیکٹری");
        setFounders(d.factory_founders ?? "زیادہ خان اور امتیاز خان");
        setDefaultUnit(d.default_length_unit ?? "ft");
        setDensity(d.marble_density ?? "2.7");
        setLanguage(d.language ?? "ur");
      })
      .catch(() => toast.error("ترتیبات لوڈ نہیں ہوسکیں۔"))
      .finally(() => setLoading(false));
  }, []);

  function handleThemeChange(next: ThemeChoice) {
    setThemeChoice(next);
    setTheme(next);
    // Persist preference in settings table too (so server-side knows).
    try {
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      }).catch(() => {});
    } catch {
      /* ignore — theme is already applied client-side */
    }
    toast.success(
      next === "light"
        ? "روشن تھیم فعال ہوگیا"
        : next === "dark"
        ? "ڈارک تھیم فعال ہوگیا"
        : "سسٹم تھیم فعال ہوگیا"
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factory_name: factoryName,
          factory_founders: founders,
          default_length_unit: defaultUnit,
          marble_density: density,
          language,
          theme: themeChoice,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("ترتیبات محفوظ ہوگئیں");
    } catch {
      toast.error("محفوظ کرنے میں مسئلہ۔");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-center py-16 text-muted-foreground">لوڈ ہو رہا ہے...</p>;
  }

  const themeOptions: { value: ThemeChoice; label: string; icon: typeof Moon; desc: string }[] = [
    { value: "light", label: "روشن", icon: Sun, desc: "سفید پس منظر، دن کے لیے بہترین" },
    { value: "dark", label: "ڈارک", icon: Moon, desc: "آنکھوں کی حفاظت کے لیے، رات کے لیے" },
    { value: "system", label: "سسٹم", icon: Monitor, desc: "آپ کے ڈیوائس کی ترجیح کے مطابق" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">ترتیبات</h2>
        <p className="text-sm text-muted-foreground mt-1">فیکٹری کی معلومات اور ترجیحات۔</p>
      </div>

      {/* Factory info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            فیکٹری کی معلومات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="factoryName">فیکٹری کا نام</Label>
            <Input id="factoryName" value={factoryName} onChange={(e) => setFactoryName(e.target.value)} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="founders">بانی</Label>
            <Input id="founders" value={founders} onChange={(e) => setFounders(e.target.value)} dir="rtl" />
          </div>
        </CardContent>
      </Card>

      {/* Units & measurement */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            پیمائش کی ترجیحات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ڈیفالٹ لمبائی کی اکائی</Label>
            <Select value={defaultUnit} onValueChange={setDefaultUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">فٹ (feet)</SelectItem>
                <SelectItem value="m">میٹر (meter)</SelectItem>
                <SelectItem value="in">انچ (inch)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="density">ماربل کی کثافت (tons/m³)</Label>
            <Input
              id="density"
              type="number"
              step="0.01"
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              dir="ltr"
              className="numeric-input"
            />
            <p className="text-xs text-muted-foreground">معمولی ماربل کی کثافت 2.7 سے 2.8 tons/m³ ہوتی ہے۔</p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance — three-option theme picker (light / dark / system) */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            ظاہری شکل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme picker — segmented control style */}
          <div className="space-y-2">
            <Label>تھیم</Label>
            <p className="text-xs text-muted-foreground">
              روشن، ڈارک یا سسٹم تھیم منتخب کریں۔ تبدیلی فوری طور پر لگائی جاتی ہے۔
            </p>
            <div
              className="grid grid-cols-3 gap-2 pt-1"
              role="radiogroup"
              aria-label="تھیم منتخب کریں"
            >
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = themeChoice === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => handleThemeChange(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all tap-target",
                      isActive
                        ? "border-accent bg-accent text-accent-foreground shadow-sm ring-2 ring-accent/40"
                        : "border-border bg-card hover:bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Description of currently selected option */}
            <p className="text-xs text-muted-foreground pt-1">
              {themeOptions.find((o) => o.value === themeChoice)?.desc}
            </p>
          </div>

          {/* Legacy dark mode switch — kept as a quick toggle, syncs with theme system */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <Label>ڈارک موڈ (فوری ٹوگل)</Label>
              <p className="text-xs text-muted-foreground">تیز رفتار ڈارک/روشن تبدیلی کے لیے سوئچ استعمال کریں۔</p>
            </div>
            <Switch
              checked={themeChoice === "dark"}
              onCheckedChange={(checked) => handleThemeChange(checked ? "dark" : "light")}
              aria-label="ڈارک موڈ ٹوگل"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <Label>زبان</Label>
              <p className="text-xs text-muted-foreground">فی الحال صرف اردو دستیاب ہے۔ مستقبل میں مزید زبانیں شامل کی جائیں گی۔</p>
            </div>
            <Select value={language} onValueChange={setLanguage} disabled>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ur">اردو</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Admin info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            ایڈمن کی معلومات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">ای میل</span>
              <span className="numeric-input">admin@almakkah.pk</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">کردار</span>
              <span>ایڈمن</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              نوٹ: فی الحال single-admin لاگ ان ہے۔ مستقبل میں multi-login + per-designation permissions کے لیے ڈیٹا بیس تیار ہے۔
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save button — sticky so it stays reachable on long pages & mobile */}
      <div className="sticky bottom-20 md:bottom-4 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full tap-target shadow-lg">
          <Save className="h-4 w-4 ml-1" />
          {saving ? "محفوظ ہو رہا ہے..." : "ترتیبات محفوظ کریں"}
        </Button>
      </div>
    </div>
  );
}
