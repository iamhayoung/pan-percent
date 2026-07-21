import type { Recipe } from "@/types/recipe";

const SEPARATOR = " · ";

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

export function buildListPreview(recipe: Recipe): string {
  const yieldText = recipe.yield?.trim();
  const ingredientParts = recipe.ingredients
    .filter((i) => i.grams > 0 && i.name.trim() !== "")
    .map((i) => `${i.name.trim()} ${formatNumber(i.grams)}g`);

  const parts = yieldText ? [yieldText, ...ingredientParts] : ingredientParts;
  return parts.join(SEPARATOR);
}
