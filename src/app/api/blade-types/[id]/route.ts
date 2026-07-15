import { createCrudItemHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.bladeType as unknown as Parameters<typeof createCrudItemHandler>[0]["delegate"],
  allowedFields: ["nameUrdu", "brand", "sizeMm", "isActive", "sortOrder"],
};

export const { GET, PUT, DELETE } = createCrudItemHandler(config);
