/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seed script for Al-Makkah Factory
 * Adds default sizes, thickness, categories, and a single admin user.
 *
 * Run: bun run /home/z/my-project/scripts/seed.ts
 */
const { PrismaClient } = require("@prisma/client");

// Simple hash for demo-only admin password. In production, use bcrypt + NextAuth.
function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return `seed$${h}`;
}

const db = new PrismaClient();

async function main() {
  console.log("Seeding Al-Makkah Factory default data...");

  // --- Admin user ---
  await db.user.upsert({
    where: { email: "admin@almakkah.pk" },
    update: {},
    create: {
      email: "admin@almakkah.pk",
      name: "زیادہ خان",
      passwordHash: simpleHash("admin123"),
      role: "admin",
      permissions: JSON.stringify({ all: true }),
    },
  });
  console.log("✓ Admin user created (admin@almakkah.pk / admin123)");

  // --- Marble Types ---
  const marbleTypes = [
    { nameUrdu: "زیارت وائٹ", originNote: "زیارت، بلوچستان" },
    { nameUrdu: "بادل گرے", originNote: null },
    { nameUrdu: "ابریق وائٹ", originNote: null },
    { nameUrdu: "ٹراورٹین", originNote: null },
  ];
  for (let i = 0; i < marbleTypes.length; i++) {
    const t = marbleTypes[i];
    await db.marbleType.create({
      data: { nameUrdu: t.nameUrdu, originNote: t.originNote, sortOrder: i },
    });
  }
  console.log(`✓ ${marbleTypes.length} marble types added`);

  // --- Marble Sizes (defaults, editable later) ---
  const sizes = [
    { lengthFt: 6, widthFt: 6, label: "6×6" },
    { lengthFt: 6, widthFt: 12, label: "6×12" },
    { lengthFt: 12, widthFt: 12, label: "12×12" },
    { lengthFt: 12, widthFt: 24, label: "12×24" },
    { lengthFt: 24, widthFt: 24, label: "24×24" },
    { lengthFt: 24, widthFt: 48, label: "24×48" },
  ];
  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    await db.marbleSize.create({
      data: { lengthFt: s.lengthFt, widthFt: s.widthFt, label: s.label, sortOrder: i },
    });
  }
  console.log(`✓ ${sizes.length} default sizes added`);

  // --- Marble Thickness ---
  const thicknesses = [
    { thicknessCm: 1, label: "1cm" },
    { thicknessCm: 2, label: "2cm" },
    { thicknessCm: 3, label: "3cm" },
  ];
  for (let i = 0; i < thicknesses.length; i++) {
    const t = thicknesses[i];
    await db.marbleThickness.create({
      data: { thicknessCm: t.thicknessCm, label: t.label, sortOrder: i },
    });
  }
  console.log(`✓ ${thicknesses.length} thickness options added`);

  // --- Labour Categories ---
  const labourCats = ["کاٹنے والا", "لوڈر", "مزدور", "ڈرائیور"];
  for (let i = 0; i < labourCats.length; i++) {
    await db.labourCategory.create({
      data: { nameUrdu: labourCats[i], sortOrder: i },
    });
  }
  console.log(`✓ ${labourCats.length} labour categories added`);

  // --- Designations ---
  const designations = ["منیجر", "سپروائزر", "مزدور", "اکاؤنٹنٹ"];
  for (let i = 0; i < designations.length; i++) {
    await db.designation.create({
      data: { nameUrdu: designations[i], sortOrder: i },
    });
  }
  console.log(`✓ ${designations.length} designations added`);

  // --- Blade Types ---
  const bladeTypes = [
    { nameUrdu: "ڈائمنڈ بلیڈ 400mm", brand: "General", sizeMm: 400 },
    { nameUrdu: "ڈائمنڈ بلیڈ 350mm", brand: "General", sizeMm: 350 },
  ];
  for (let i = 0; i < bladeTypes.length; i++) {
    const b = bladeTypes[i];
    await db.bladeType.create({
      data: { nameUrdu: b.nameUrdu, brand: b.brand, sizeMm: b.sizeMm, sortOrder: i },
    });
  }
  console.log(`✓ ${bladeTypes.length} blade types added`);

  // --- Food Categories ---
  const foodCats = ["ناشتہ", "دوپہر کا کھانا", "چائے", "سبزیاں", "تیل / گھی"];
  for (let i = 0; i < foodCats.length; i++) {
    await db.foodCategory.create({
      data: { nameUrdu: foodCats[i], sortOrder: i },
    });
  }
  console.log(`✓ ${foodCats.length} food categories added`);

  // --- Settings ---
  await db.setting.upsert({
    where: { id: "factory_name" },
    update: {},
    create: { id: "factory_name", value: "المکہ فیکٹری" },
  });
  await db.setting.upsert({
    where: { id: "factory_founders" },
    update: {},
    create: { id: "factory_founders", value: "زیادہ خان اور امتیاز خان" },
  });
  await db.setting.upsert({
    where: { id: "default_length_unit" },
    update: {},
    create: { id: "default_length_unit", value: "ft" },
  });
  await db.setting.upsert({
    where: { id: "marble_density" },
    update: {},
    create: { id: "marble_density", value: "2.7" },
  });
  console.log("✓ Settings added");

  console.log("\nSeed complete!");
  console.log("Login: admin@almakkah.pk / admin123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
