import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
    const search = url.searchParams.get("search")?.trim();
    const categoryId = url.searchParams.get("categoryId");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { itemName: { contains: search } },
        { notes: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [items, total] = await Promise.all([
      db.foodExpense.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.foodExpense.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    console.error("food-expenses GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, categoryId, itemName, quantity, unit, cost, notes } = await req.json();
    if (!date || !categoryId || !itemName?.trim() || quantity == null || !unit || cost == null) {
      return NextResponse.json(
        { error: "date, categoryId, itemName, quantity, unit, cost are required" },
        { status: 400 }
      );
    }
    const item = await db.foodExpense.create({
      data: {
        date: new Date(date),
        categoryId,
        itemName: itemName.trim(),
        quantity: parseFloat(quantity),
        unit,
        cost: parseFloat(cost),
        notes: notes || null,
      },
      include: { category: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("food-expenses POST error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
