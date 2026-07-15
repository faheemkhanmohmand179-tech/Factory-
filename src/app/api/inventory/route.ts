import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
    const type = url.searchParams.get("type"); // raw_rock_in | slab_out | adjustment

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        include: {
          marbleType: true,
          size: true,
          thickness: true,
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.inventoryItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    console.error("inventory GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      type,
      marbleTypeId,
      sizeId,
      thicknessId,
      quantity,
      weightTons,
      notes,
      cuttingRecordId,
    } = body;

    if (!date || !type || quantity == null) {
      return NextResponse.json(
        { error: "date, type, quantity are required" },
        { status: 400 }
      );
    }

    const item = await db.inventoryItem.create({
      data: {
        date: new Date(date),
        type,
        marbleTypeId: marbleTypeId || null,
        sizeId: sizeId || null,
        thicknessId: thicknessId || null,
        quantity: parseFloat(quantity),
        weightTons: weightTons ? parseFloat(weightTons) : null,
        notes: notes || null,
        cuttingRecordId: cuttingRecordId || null,
      },
      include: { marbleType: true, size: true, thickness: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("inventory POST error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
