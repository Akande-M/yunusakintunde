/*
 * The 11 local government areas of Oyo Central Senatorial District, grouped by zone.
 * Pages tag content with one of these names to show it under that local government's tab.
 */

export const ZONES = [
  { zone: "Ibadan", lgas: ["Akinyele", "Egbeda", "Lagelu", "Oluyole", "Ona Ara"] },
  { zone: "Oyo", lgas: ["Afijio", "Atiba", "Oyo East", "Oyo West"] },
  { zone: "Ogbomoso", lgas: ["Ogo Oluwa", "Surulere"] },
] as const;

export type Zone = (typeof ZONES)[number]["zone"];

export const LGAS: string[] = ZONES.flatMap((z) => [...z.lgas]);

const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** The zone a local government belongs to, or null. */
export function zoneOf(lga: string): Zone | null {
  const k = key(lga);
  return ZONES.find((z) => z.lgas.some((l) => key(l) === k))?.zone ?? null;
}

/**
 * Finds which of the 11 local governments some text names, e.g. "Ona-Ara LGA" or
 * "Ogo-Oluwa Local Government" → "Ona Ara" / "Ogo Oluwa". Returns null if none or unclear.
 */
export function matchLga(text: string): string | null {
  const k = key(text);
  const hits = LGAS.filter((l) => k.includes(key(l)));
  // "Oyo East" also contains "Oyo"; only the full names are listed, so a single hit is clear.
  return hits.length === 1 ? hits[0]! : null;
}

/** Normalises a stored value to one of the 11 names ("" = the whole district). */
export function normalizeLga(v: unknown): string {
  if (typeof v !== "string" || !v.trim()) return "";
  return LGAS.find((l) => key(l) === key(v)) ?? "";
}

export const lgaSlug = (lga: string) => lga.toLowerCase().replace(/[^a-z0-9]+/g, "-");
