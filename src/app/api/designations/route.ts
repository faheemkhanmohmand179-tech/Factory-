import { createCrudHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.designation as unknown as Parameters<typeof createCrudHandler>[0]["delegate"],
  allowedFields: ["nameUrdu", "isActive", "sortOrder"],
};

export const { GET, POST } = createCrudHandler(config);
