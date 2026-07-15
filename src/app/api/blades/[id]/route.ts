import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.bladeTypeId !== undefined) data.bladeTypeId = body.bladeTypeId;
    if (body.serialNumber !== undefined) data.serialNumber = body.serialNumber || null;
    if (body.purchaseDate !== undefined)
      data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    if (body.condition !== undefined) data.condition = body.condition;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.reorderPoint !== undefined) data.reorderPoint = body.reorderPoint;

    const item = await db.blade.update({
      where: { id },
      data,
      include: { bladeType: true },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.blade.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
