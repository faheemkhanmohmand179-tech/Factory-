import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bladeTypeId = url.searchParams.get("bladeTypeId");

    const where: Record<string, unknown> = {};
    if (bladeTypeId) where.bladeTypeId = bladeTypeId;

    const items = await db.blade.findMany({
      where,
      include: { bladeType: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { bladeTypeId, serialNumber, purchaseDate, condition, isActive, reorderPoint } =
      await req.json();
    if (!bladeTypeId) {
      return NextResponse.json({ error: "bladeTypeId is required" }, { status: 400 });
    }
    const item = await db.blade.create({
      data: {
        bladeTypeId,
        serialNumber: serialNumber || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        condition: condition || "new",
        isActive: isActive ?? true,
        reorderPoint: reorderPoint ?? 3,
      },
      include: { bladeType: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("blades POST error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
