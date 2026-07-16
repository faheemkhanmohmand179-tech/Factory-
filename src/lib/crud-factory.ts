/**
 * Generic CRUD handler factory for simple reference-data tables.
 * All endpoints follow the same pattern:
 *   GET    /api/<resource>          -> list (with optional ?search=)
 *   POST   /api/<resource>          -> create
 *   GET    /api/<resource>/<id>     -> get one
 *   PUT    /api/<resource>/<id>     -> update (partial ok)
 *   DELETE /api/<resource>/<id>     -> delete
 *
 * Each table exposes: id, nameUrdu, isActive, sortOrder + extra fields.
 *
 * IMPORTANT: This module re-exports `db` from "@/lib/db" so the entire
 * application shares ONE PrismaClient singleton. Previously this file
 * did `new PrismaClient()` on every import, which (a) leaked connections
 * and (b) bypassed the env-driven configuration in lib/db.ts, causing
 * "Failed to fetch" / 500 errors on Vercel serverless functions.
 *
 * FIX (this file): `where` was typed as `Prisma.Sql | Record<string, unknown>`
 * and then indexed with `where[searchField] = ...`. `Prisma.Sql` has no index
 * signature, so this is a TypeScript type error under `strict` mode — it was
 * breaking the production build (or being silently mistyped depending on
 * tsconfig settings), which is why saving records on every reference-data
 * tab (marble types, sizes, thicknesses, blade types, designations, food
 * categories, labour categories, etc.) was unreliable. The unused `Prisma`
 * import is removed and `where` is now plainly typed as
 * `Record<string, unknown>`, which is all this generic filter ever needed.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Delegate = {
  findMany: (args?: { where?: unknown; orderBy?: unknown }) => Promise<unknown[]>;
  create: (args: { data: unknown }) => Promise<unknown>;
  findUnique: (args: { where: { id: string } }) => Promise<unknown | null>;
  update: (args: { where: { id: string }; data: unknown }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
  count?: (args?: { where?: unknown }) => Promise<number>;
};

interface ResourceConfig {
  delegate: Delegate;
  allowedFields: string[]; // fields allowed in create/update
  searchField?: string; // field used for search filter (default: nameUrdu)
}

export function createCrudHandler(config: ResourceConfig) {
  const { delegate, allowedFields, searchField = "nameUrdu" } = config;

  function filterPayload(body: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        out[key] = body[key];
      }
    }
    return out;
  }

  async function GET(req: NextRequest) {
    try {
      const url = new URL(req.url);
      const search = url.searchParams.get("search")?.trim();
      const where: Record<string, unknown> = {};
      if (search) {
        where[searchField] = { contains: search };
      }
      const items = await delegate.findMany({
        where,
        orderBy: { sortOrder: "asc" } as unknown as never,
      });
      return NextResponse.json({ items });
    } catch (e) {
      console.error("GET error:", e);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
  }

  async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const payload = filterPayload(body);
      if (!payload.nameUrdu || !String(payload.nameUrdu).trim()) {
        return NextResponse.json({ error: "nameUrdu is required" }, { status: 400 });
      }
      const item = await delegate.create({ data: payload });
      return NextResponse.json(item, { status: 201 });
    } catch (e) {
      console.error("POST error:", e);
      return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }
  }

  return { GET, POST };
}

export function createCrudItemHandler(config: ResourceConfig) {
  const { delegate, allowedFields } = config;

  function filterPayload(body: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        out[key] = body[key];
      }
    }
    return out;
  }

  async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await ctx.params;
      const item = await delegate.findUnique({ where: { id } });
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(item);
    } catch (e) {
      console.error("GET item error:", e);
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }

  async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await ctx.params;
      const body = await req.json();
      const payload = filterPayload(body);
      const item = await delegate.update({ where: { id }, data: payload });
      return NextResponse.json(item);
    } catch (e) {
      console.error("PUT error:", e);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await ctx.params;
      await delegate.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error("DELETE error:", e);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
  }

  return { GET, PUT, DELETE };
}

export { db };
