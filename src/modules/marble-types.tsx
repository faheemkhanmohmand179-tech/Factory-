"use client";

import { CategoryManager } from "@/components/category-manager";

export default function MarbleTypesModule() {
  return (
    <CategoryManager
      apiBase="/api/marble-types"
      title="پتھر کی اقسام"
      description="ماربل کی مختلف اقسام کے نام اور ان کی اصل (کواری) کی معلومات۔"
      singularName="پتھر کی قسم"
      addLabel="نئی قسم شامل کریں"
      emptyMessage="ابھی کوئی پتھر کی قسم نہیں ہے"
      extraFields={[
        {
          key: "originNote",
          label: "اصل / کواری کی تفصیل",
          type: "textarea",
          placeholder: "مثال: زیارت، بلوچستان",
        },
      ]}
      renderExtra={(item) =>
        item.originNote ? (
          <span className="text-xs text-muted-foreground truncate">
            • {String(item.originNote)}
          </span>
        ) : null
      }
    />
  );
}
