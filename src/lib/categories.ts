export const SPORT_CATEGORIES = [
  { key: "all", label: "All Sports" },
  { key: "football", label: "Football" },
  { key: "basketball", label: "Basketball" },
  { key: "volleyball", label: "Volleyball" },
  { key: "tennis", label: "Tennis" },
  { key: "badminton", label: "Badminton" },
  { key: "swimming", label: "Swimming" },
  { key: "gym", label: "Gym & Fitness" },
  { key: "handball", label: "Handball" },
  { key: "recreation", label: "Other Recreation" },
] as const;

export type SportCategoryKey = (typeof SPORT_CATEGORIES)[number]["key"];
export type SportKey = Exclude<SportCategoryKey, "all">;

export const SPORT_LABELS: Record<SportKey, string> = Object.fromEntries(
  SPORT_CATEGORIES.filter((c) => c.key !== "all").map((c) => [c.key, c.label]),
) as Record<SportKey, string>;

export function matchesCategory(
  facility: { category: string; activities: string[] },
  category: SportCategoryKey | string,
): boolean {
  if (category === "all") return true;
  return facility.category === category || facility.activities.includes(category);
}
