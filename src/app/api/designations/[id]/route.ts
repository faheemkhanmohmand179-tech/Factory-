import { createCrudItemHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.designation as unknown as Parameters<typeof createCrudItemHandler>[0]["delegate"],
  allowedFields: ["nameUrdu", "isActive", "sortOrder"],
};

export const { GET, PUT, DELETE } = createCrudItemHandler(config);
