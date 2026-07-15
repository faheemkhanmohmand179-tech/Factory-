import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim();
    const designationId = url.searchParams.get("designationId");

    const where: Record<string, unknown> = {};
    if (search) where.nameUrdu = { contains: search };
    if (designationId) where.designationId = designationId;

    const items = await db.staff.findMany({
      where,
      include: { designation: true },
      orderBy: { nameUrdu: "asc" },
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("staff GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nameUrdu, designationId, phone, isActive = true } = body;

    if (!nameUrdu?.trim() || !designationId) {
      return NextResponse.json(
        { error: "nameUrdu and designationId are required" },
        { status: 400 }
      );
    }

    const item = await db.staff.create({
      data: {
        nameUrdu: nameUrdu.trim(),
        designationId,
        phone: phone || null,
        isActive,
      },
      include: { designation: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("staff POST error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
