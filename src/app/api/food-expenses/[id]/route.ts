import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;
    if (body.itemName !== undefined) data.itemName = body.itemName.trim();
    if (body.quantity !== undefined) data.quantity = parseFloat(body.quantity);
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.cost !== undefined) data.cost = parseFloat(body.cost);
    if (body.notes !== undefined) data.notes = body.notes || null;

    const item = await db.foodExpense.update({
      where: { id },
      data,
      include: { category: true },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.foodExpense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
