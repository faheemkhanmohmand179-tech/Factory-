import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const item = await db.cuttingRecord.findUnique({
      where: { id },
      include: {
        marbleType: true,
        size: true,
        thickness: true,
        blade: { include: { bladeType: true } },
      },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const {
      date,
      marbleTypeId,
      sizeId,
      thicknessId,
      lengthUnit,
      calculatedWeight,
      actualWeight,
      bladeId,
      labourCategoryIds,
      staffIds,
      notes,
    } = body;

    const data: Record<string, unknown> = {};
    if (date) data.date = new Date(date);
    if (marbleTypeId) data.marbleTypeId = marbleTypeId;
    if (sizeId) data.sizeId = sizeId;
    if (thicknessId) data.thicknessId = thicknessId;
    if (lengthUnit) data.lengthUnit = lengthUnit;
    if (calculatedWeight !== undefined) data.calculatedWeight = calculatedWeight;
    if (actualWeight !== undefined) data.actualWeight = actualWeight;
    if (bladeId !== undefined) data.bladeId = bladeId || null;
    // labourCategoryIds / staffIds are String[] (uuid[]) columns in the DB;
    // pass arrays directly — do NOT JSON.stringify them.
    if (labourCategoryIds !== undefined)
      data.labourCategoryIds = Array.isArray(labourCategoryIds) ? labourCategoryIds : [];
    if (staffIds !== undefined)
      data.staffIds = Array.isArray(staffIds) ? staffIds : [];
    if (notes !== undefined) data.notes = notes || null;

    const item = await db.cuttingRecord.update({
      where: { id },
      data,
      include: {
        marbleType: true,
        size: true,
        thickness: true,
        blade: { include: { bladeType: true } },
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("cutting-records PUT error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.cuttingRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("cutting-records DELETE error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
