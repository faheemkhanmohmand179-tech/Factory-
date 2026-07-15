/**
 * Weight calculation utilities for marble slabs
 *
 * Standard marble density: ~2.7 - 2.8 tons/m³
 * We use 2.7 as a conservative default.
 *
 * Volume calculation:
 *   V (m³) = length (m) × width (m) × thickness (m)
 *
 * Unit conversions:
 *   1 ft  = 0.3048 m
 *   1 in  = 0.0254 m
 *   1 cm  = 0.01 m
 *   1 m³ of marble ≈ 2.7 tons
 */

export const MARBLE_DENSITY_TONS_PER_M3 = 2.7;

export type LengthUnit = "ft" | "m" | "in";

const UNIT_TO_METER: Record<LengthUnit, number> = {
  ft: 0.3048,
  m: 1,
  in: 0.0254,
};

const UNIT_LABELS_URDU: Record<LengthUnit, string> = {
  ft: "فٹ",
  m: "میٹر",
  in: "انچ",
};

export function getUnitLabelUrdu(unit: LengthUnit): string {
  return UNIT_LABELS_URDU[unit] ?? unit;
}

/**
 * Convert any length value to meters
 */
export function toMeters(value: number, unit: LengthUnit): number {
  return value * UNIT_TO_METER[unit];
}

/**
 * Calculate estimated weight of a marble slab in tons
 *
 * @param length    Length value
 * @param width     Width value
 * @param thicknessCm  Thickness in centimeters
 * @param unit      Unit of length & width (ft | m | in)
 * @param density   Optional density override (tons/m³), defaults to 2.7
 * @returns Weight in tons (rounded to 3 decimal places)
 */
export function calculateSlabWeight(
  length: number,
  width: number,
  thicknessCm: number,
  unit: LengthUnit = "ft",
  density: number = MARBLE_DENSITY_TONS_PER_M3
): number {
  if (
    !Number.isFinite(length) ||
    !Number.isFinite(width) ||
    !Number.isFinite(thicknessCm) ||
    length <= 0 ||
    width <= 0 ||
    thicknessCm <= 0
  ) {
    return 0;
  }

  const lengthM = toMeters(length, unit);
  const widthM = toMeters(width, unit);
  const thicknessM = thicknessCm / 100;

  const volumeM3 = lengthM * widthM * thicknessM;
  const weightTons = volumeM3 * density;

  return Math.round(weightTons * 1000) / 1000;
}

/**
 * Format a weight in tons with Urdu unit suffix
 */
export function formatWeight(tons: number | null | undefined): string {
  if (tons == null || !Number.isFinite(tons)) return "—";
  return `${tons.toLocaleString("ur-PK", { maximumFractionDigits: 3 })} ٹن`;
}

/**
 * Format dimensions for display
 */
export function formatDimensions(
  length: number,
  width: number,
  unit: LengthUnit = "ft"
): string {
  const label = getUnitLabelUrdu(unit);
  return `${length} × ${width} ${label}`;
}
