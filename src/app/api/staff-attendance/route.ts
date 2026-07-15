import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const staffId = url.searchParams.get("staffId");
    const date = url.searchParams.get("date");

    const where: Record<string, unknown> = {};
    if (staffId) where.staffId = staffId;
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    }

    const items = await db.staffAttendance.findMany({
      where,
      include: { staff: { include: { designation: true } } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("attendance GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { staffId, date, status, notes } = await req.json();
    if (!staffId || !date || !status) {
      return NextResponse.json(
        { error: "staffId, date, status are required" },
        { status: 400 }
      );
    }
    const d = new Date(date);
    const item = await db.staffAttendance.upsert({
      where: { staffId_date: { staffId, date: d } },
      update: { status, notes: notes || null },
      create: { staffId, date: d, status, notes: notes || null },
      include: { staff: { include: { designation: true } } },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("attendance POST error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
