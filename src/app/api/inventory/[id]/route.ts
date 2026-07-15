import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.type !== undefined) data.type = body.type;
    if (body.marbleTypeId !== undefined) data.marbleTypeId = body.marbleTypeId || null;
    if (body.sizeId !== undefined) data.sizeId = body.sizeId || null;
    if (body.thicknessId !== undefined) data.thicknessId = body.thicknessId || null;
    if (body.quantity !== undefined) data.quantity = parseFloat(body.quantity);
    if (body.weightTons !== undefined) data.weightTons = body.weightTons ? parseFloat(body.weightTons) : null;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const item = await db.inventoryItem.update({
      where: { id },
      data,
      include: { marbleType: true, size: true, thickness: true },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
