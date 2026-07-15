import { createCrudHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.marbleSize as unknown as Parameters<typeof createCrudHandler>[0]["delegate"],
  allowedFields: ["lengthFt", "widthFt", "label", "isActive", "sortOrder"],
  searchField: "label",
};

export const { GET, POST } = createCrudHandler(config);
