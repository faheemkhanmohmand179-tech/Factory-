import { createCrudItemHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.marbleSize as unknown as Parameters<typeof createCrudItemHandler>[0]["delegate"],
  allowedFields: ["lengthFt", "widthFt", "label", "isActive", "sortOrder"],
};

export const { GET, PUT, DELETE } = createCrudItemHandler(config);
