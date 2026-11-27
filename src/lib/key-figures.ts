import type { AchievementCard } from "@/lib/achievements-data";

/**
 * The approved key figures, kept in one place (Homepage settings → "Key figures") and shown
 * on both the homepage and the Achievements page, so the two never disagree.
 * "{projects}" in a figure is replaced by the live count of projects & programmes listed on
 * the local government achievement cards.
 */
export type Figure = { n: string; l: string };

export const PROJECTS_TOKEN = "{projects}";

export function countProjects(cards: AchievementCard[]): number {
  return cards
    .filter((c) => c.zone.toLowerCase() !== "senate")
    .reduce((a, c) => a + c.items.length, 0);
}

export function keyFigures(stats: Figure[], cards: AchievementCard[]): Figure[] {
  const projects = countProjects(cards);
  return stats
    .map((s) => ({
      ...s,
      n: s.n.includes(PROJECTS_TOKEN)
        ? s.n.replace(PROJECTS_TOKEN, projects ? projects.toLocaleString("en-NG") : "")
        : s.n,
    }))
    .filter((s) => s.n.trim() && s.l.trim());
}
