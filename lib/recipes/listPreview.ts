import type { Recipe } from "@/types/recipe";

const SEPARATOR = " · ";

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

export function buildListPreview(recipe: Recipe): string {
  const parts = recipe.ingredients
    .filter((i) => i.grams > 0 && i.name.trim() !== "")
    .map((i) => `${i.name.trim()} ${formatNumber(i.grams)}g`);

  return parts.join(SEPARATOR);
}
