import { createCrudHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.bladeType as unknown as Parameters<typeof createCrudHandler>[0]["delegate"],
  allowedFields: ["nameUrdu", "brand", "sizeMm", "isActive", "sortOrder"],
};

export const { GET, POST } = createCrudHandler(config);
