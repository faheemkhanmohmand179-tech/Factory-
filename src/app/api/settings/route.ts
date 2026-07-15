import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/crud-factory";

export async function GET() {
  try {
    const settings = await db.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => (map[s.id] = s.value));
    return NextResponse.json(map);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json(); // { key: value, ... }
    const ops = Object.entries(body).map(([id, value]) =>
      db.setting.upsert({
        where: { id },
        update: { value: String(value) },
        create: { id, value: String(value) },
      })
    );
    await Promise.all(ops);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("settings PUT error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
