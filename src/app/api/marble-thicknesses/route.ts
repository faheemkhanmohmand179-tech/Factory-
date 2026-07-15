import { createCrudHandler, db } from "@/lib/crud-factory";

const config = {
  delegate: db.marbleThickness as unknown as Parameters<typeof createCrudHandler>[0]["delegate"],
  allowedFields: ["thicknessCm", "label", "isActive", "sortOrder"],
  searchField: "label",
};

export const { GET, POST } = createCrudHandler(config);
