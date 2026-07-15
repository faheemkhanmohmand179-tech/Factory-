"use client";

import { CategoryManager } from "@/components/category-manager";

export default function LabourCategoriesModule() {
  return (
    <CategoryManager
      apiBase="/api/labour-categories"
      title="مزدور کی اقسام"
      description="مزدوروں کے مختلف کردار — کاٹنے والا، لوڈر، مزدور، ڈرائیور وغیرہ۔ یہ اقسام کٹنگ ریکارڈ سے جڑی ہوں گی۔"
      singularName="مزدور کی قسم"
      addLabel="نئی قسم شامل کریں"
      emptyMessage="ابھی کوئی مزدور کی قسم نہیں ہے"
    />
  );
}
