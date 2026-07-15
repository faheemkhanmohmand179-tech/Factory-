import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.nameUrdu !== undefined) data.nameUrdu = body.nameUrdu.trim();
    if (body.designationId !== undefined) data.designationId = body.designationId;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const item = await db.staff.update({
      where: { id },
      data,
      include: { designation: true },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("staff PUT error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await db.staff.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
