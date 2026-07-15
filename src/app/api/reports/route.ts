import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "week"; // week | month | today

    const now = new Date();
    const start = new Date(now);
    if (range === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      start.setDate(now.getDate() - 7);
    } else if (range === "month") {
      start.setMonth(now.getMonth() - 1);
    }

    const [cuttingRecords, foodExpenses, blades, attendance, allStaff] = await Promise.all([
      db.cuttingRecord.findMany({
        where: { date: { gte: start, lte: now } },
        include: { marbleType: true, size: true, thickness: true, blade: { include: { bladeType: true } } },
        orderBy: { date: "asc" },
      }),
      db.foodExpense.findMany({
        where: { date: { gte: start, lte: now } },
        include: { category: true },
        orderBy: { date: "asc" },
      }),
      db.blade.findMany({
        include: { bladeType: true },
        where: { isActive: true },
      }),
      db.staffAttendance.findMany({
        where: { date: { gte: start, lte: now } },
        include: { staff: { include: { designation: true } } },
      }),
      db.staff.findMany({ include: { designation: true } }),
    ]);

    // Group cutting records by day
    const byDay: Record<string, { count: number; weight: number }> = {};
    cuttingRecords.forEach((r) => {
      const dayKey = r.date.toISOString().split("T")[0];
      if (!byDay[dayKey]) byDay[dayKey] = { count: 0, weight: 0 };
      byDay[dayKey].count += 1;
      byDay[dayKey].weight += r.actualWeight ?? r.calculatedWeight ?? 0;
    });

    // Group by marble type
    const byType: Record<string, { count: number; weight: number }> = {};
    cuttingRecords.forEach((r) => {
      const name = r.marbleType?.nameUrdu ?? "—";
      if (!byType[name]) byType[name] = { count: 0, weight: 0 };
      byType[name].count += 1;
      byType[name].weight += r.actualWeight ?? r.calculatedWeight ?? 0;
    });

    // Group food by category
    const foodByCategory: Record<string, number> = {};
    foodExpenses.forEach((e) => {
      const name = e.category?.nameUrdu ?? "—";
      foodByCategory[name] = (foodByCategory[name] ?? 0) + e.cost;
    });

    // Attendance summary
    const attendanceSummary: Record<string, { present: number; absent: number; halfDay: number; leave: number }> = {};
    attendance.forEach((a) => {
      const staffName = a.staff?.nameUrdu ?? "—";
      if (!attendanceSummary[staffName]) {
        attendanceSummary[staffName] = { present: 0, absent: 0, halfDay: 0, leave: 0 };
      }
      if (a.status === "present") attendanceSummary[staffName].present += 1;
      else if (a.status === "absent") attendanceSummary[staffName].absent += 1;
      else if (a.status === "half_day") attendanceSummary[staffName].halfDay += 1;
      else if (a.status === "leave") attendanceSummary[staffName].leave += 1;
    });

    return NextResponse.json({
      range,
      totalCuttingRecords: cuttingRecords.length,
      totalCuttingWeight: Math.round(
        cuttingRecords.reduce((s, r) => s + (r.actualWeight ?? r.calculatedWeight ?? 0), 0) * 1000
      ) / 1000,
      totalFoodCost: foodExpenses.reduce((s, e) => s + e.cost, 0),
      cuttingByDay: byDay,
      cuttingByType: byType,
      foodByCategory,
      bladeSummary: blades.map((b) => ({
        id: b.id,
        bladeType: b.bladeType?.nameUrdu ?? "—",
        brand: b.bladeType?.brand ?? "—",
        condition: b.condition,
        serialNumber: b.serialNumber,
        reorderPoint: b.reorderPoint,
      })),
      attendanceSummary,
      totalStaff: allStaff.length,
    });
  } catch (e) {
    console.error("reports GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
