import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
    const search = url.searchParams.get("search")?.trim();

    const where = search
      ? {
          OR: [
            { marbleType: { nameUrdu: { contains: search } } },
            { size: { label: { contains: search } } },
            { thickness: { label: { contains: search } } },
            { notes: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      db.cuttingRecord.findMany({
        where,
        include: {
          marbleType: true,
          size: true,
          thickness: true,
          blade: { include: { bladeType: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.cuttingRecord.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (e) {
    console.error("cutting-records GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      marbleTypeId,
      sizeId,
      thicknessId,
      lengthUnit = "ft",
      calculatedWeight,
      actualWeight,
      bladeId,
      labourCategoryIds,
      staffIds,
      notes,
    } = body;

    if (!date || !marbleTypeId || !sizeId || !thicknessId) {
      return NextResponse.json(
        { error: "date, marbleTypeId, sizeId, thicknessId are required" },
        { status: 400 }
      );
    }

    const item = await db.cuttingRecord.create({
      data: {
        date: new Date(date),
        marbleTypeId,
        sizeId,
        thicknessId,
        lengthUnit,
        calculatedWeight: calculatedWeight ?? null,
        actualWeight: actualWeight ?? null,
        bladeId: bladeId || null,
        // labourCategoryIds / staffIds are String[] (uuid[]) columns in the DB;
        // pass arrays directly — do NOT JSON.stringify them.
        labourCategoryIds: Array.isArray(labourCategoryIds) ? labourCategoryIds : [],
        staffIds: Array.isArray(staffIds) ? staffIds : [],
        notes: notes || null,
      },
      include: {
        marbleType: true,
        size: true,
        thickness: true,
        blade: { include: { bladeType: true } },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("cutting-records POST error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
