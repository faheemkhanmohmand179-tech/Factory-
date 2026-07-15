"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "@/components/category-manager";

export default function SizesThicknessModule() {
  const [tab, setTab] = useState("sizes");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">سائز اور موٹائی</h2>
        <p className="text-sm text-muted-foreground mt-1">
          سائز اور موٹائی کو الگ الگ منظم فہرستوں کے طور پر رکھیں — پھر ان کو ملا کر کٹنگ ریکارڈ بنائیں۔
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sizes">سائز</TabsTrigger>
          <TabsTrigger value="thickness">موٹائی</TabsTrigger>
        </TabsList>

        <TabsContent value="sizes" className="mt-4">
          <CategoryManager
            apiBase="/api/marble-sizes"
            title="ماربل سائز"
            description="لمبائی × چوڑائی (فٹ میں)۔ ڈیفالٹ سائزز پہلے سے موجود ہیں، ان میں ترمیم یا نئے شامل کریں۔"
            singularName="سائز"
            addLabel="نیا سائز شامل کریں"
            emptyMessage="ابھی کوئی سائز نہیں ہے"
            extraFields={[
              {
                key: "lengthFt",
                label: "لمبائی (فٹ) *",
                type: "number",
                required: true,
                step: 0.1,
                placeholder: "مثال: 12",
              },
              {
                key: "widthFt",
                label: "چوڑائی (فٹ) *",
                type: "number",
                required: true,
                step: 0.1,
                placeholder: "مثال: 24",
              },
              {
                key: "label",
                label: "لیبل (اختیاری)",
                type: "text",
                placeholder: "مثال: 12×24",
              },
            ]}
            renderExtra={(item) => (
              <span className="text-xs text-muted-foreground">
                • {String(item.lengthFt)} × {String(item.widthFt)} فٹ
              </span>
            )}
          />
        </TabsContent>

        <TabsContent value="thickness" className="mt-4">
          <CategoryManager
            apiBase="/api/marble-thicknesses"
            title="ماربل موٹائی"
            description="موٹائی سینٹی میٹر میں — 1cm، 2cm، 3cm وغیرہ۔"
            singularName="موٹائی"
            addLabel="نئی موٹائی شامل کریں"
            emptyMessage="ابھی کوئی موٹائی نہیں ہے"
            extraFields={[
              {
                key: "thicknessCm",
                label: "موٹائی (سینٹی میٹر) *",
                type: "number",
                required: true,
                step: 0.1,
                placeholder: "مثال: 2",
              },
              {
                key: "label",
                label: "لیبل (اختیاری)",
                type: "text",
                placeholder: "مثال: 2cm",
              },
            ]}
            renderExtra={(item) => (
              <span className="text-xs text-muted-foreground">
                • {String(item.thicknessCm)} cm
              </span>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
