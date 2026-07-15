import { createCrudItemHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.marbleThickness as unknown as Parameters<typeof createCrudItemHandler>[0]["delegate"],
  allowedFields: ["thicknessCm", "label", "isActive", "sortOrder"],
};

export const { GET, PUT, DELETE } = createCrudItemHandler(config);
