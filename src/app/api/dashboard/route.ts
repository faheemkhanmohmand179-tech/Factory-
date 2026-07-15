import { NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      todayCuttingCount,
      todayCuttingRecords,
      activeStaffCount,
      totalStaffCount,
      activeBlades,
      lowStockBlades,
      recentCutting,
      recentFood,
      marbleTypeCount,
      todayFoodCost,
    ] = await Promise.all([
      db.cuttingRecord.count({
        where: { date: { gte: today, lt: tomorrow } },
      }),
      db.cuttingRecord.findMany({
        where: { date: { gte: today, lt: tomorrow } },
        select: { actualWeight: true, calculatedWeight: true },
      }),
      db.staff.count({ where: { isActive: true } }),
      db.staff.count(),
      db.blade.count({
        where: { isActive: true, condition: { in: ["new", "good"] } },
      }),
      db.blade.count({
        where: { isActive: true, condition: "worn" },
      }),
      db.cuttingRecord.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          marbleType: true,
          size: true,
          thickness: true,
        },
      }),
      db.foodExpense.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { category: true },
      }),
      db.marbleType.count({ where: { isActive: true } }),
      db.foodExpense.aggregate({
        where: { date: { gte: today, lt: tomorrow } },
        _sum: { cost: true },
      }),
    ]);

    const todayWeight = todayCuttingRecords.reduce(
      (sum, r) => sum + (r.actualWeight ?? r.calculatedWeight ?? 0),
      0
    );

    return NextResponse.json({
      today: {
        cuttingCount: todayCuttingCount,
        cuttingWeightTons: Math.round(todayWeight * 1000) / 1000,
        activeStaff: activeStaffCount,
        foodCost: todayFoodCost._sum.cost ?? 0,
      },
      totals: {
        staff: totalStaffCount,
        marbleTypes: marbleTypeCount,
        activeBlades,
        lowStockBlades,
      },
      recent: {
        cutting: recentCutting,
        food: recentFood,
      },
    });
  } catch (e) {
    console.error("dashboard GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
