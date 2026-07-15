import { createCrudItemHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.marbleType as unknown as Parameters<typeof createCrudItemHandler>[0]["delegate"],
  allowedFields: ["nameUrdu", "originNote", "isActive", "sortOrder"],
};

export const { GET, PUT, DELETE } = createCrudItemHandler(config);
