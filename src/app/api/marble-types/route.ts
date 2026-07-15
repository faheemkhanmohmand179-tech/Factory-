import { createCrudHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.marbleType as unknown as Parameters<typeof createCrudHandler>[0]["delegate"],
  allowedFields: ["nameUrdu", "originNote", "isActive", "sortOrder"],
};

export const { GET, POST } = createCrudHandler(config);
