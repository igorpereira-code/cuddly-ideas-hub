// Matching simulado ("asistido por IA"). Reemplazable por una IA real.
import type { FoundItem, LostReport } from "./types";

const STOP = new Set(
  "de del el la los las un una unos unas y o en con sin por para al a mi su sus es que lo se muy color tipo".split(" "),
);

export function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function keywords(s: string) {
  return new Set(
    normalize(s)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

export function similarity(found: FoundItem, lost: LostReport): number {
  if (found.category !== lost.category) return 0;
  let score = 30;
  if (lost.places.includes(found.place)) score += 20;
  const d = new Date(found.date).getTime();
  const from = new Date(lost.dateFrom + "T00:00:00").getTime();
  const to = new Date(lost.dateTo + "T23:59:59").getTime();
  if (d >= from && d <= to) score += 20;
  else if (d > to && d - to <= 3 * 86400000) score += 10;
  const a = keywords(found.description);
  const b = keywords(lost.description + " " + (lost.placesText ?? ""));
  let common = 0;
  a.forEach((w) => b.has(w) && common++);
  score += Math.min(30, common * 10);
  return Math.min(100, score);
}

export const MIN_SCORE = 40;
export const level = (score: number) => (score >= 70 ? "Alta" : "Media");
