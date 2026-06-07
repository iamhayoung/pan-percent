import type { Ingredient } from "@/types/recipe";

export type BakerPercent = { id: string; percent: number | null };

export function totalFlour(ingredients: Ingredient[]): number {
  return ingredients
    .filter((ingredient) => ingredient.isFlour)
    .reduce((sum, ingredient) => sum + ingredient.grams, 0);
}

export function totalWeight(ingredients: Ingredient[]): number {
  return ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0);
}

export function bakerPercents(ingredients: Ingredient[]): BakerPercent[] {
  const flour = totalFlour(ingredients);
  return ingredients.map((ingredient) => ({
    id: ingredient.id,
    percent: flour > 0 ? (ingredient.grams / flour) * 100 : null,
  }));
}

export function scaleToFlour(
  ingredients: Ingredient[],
  targetFlour: number,
): Ingredient[] | null {
  const flour = totalFlour(ingredients);
  if (flour <= 0 || !Number.isFinite(targetFlour) || targetFlour <= 0) {
    return null;
  }
  const factor = targetFlour / flour;
  return ingredients.map((ingredient) => ({
    ...ingredient,
    grams: Math.round(ingredient.grams * factor),
  }));
}

export function gramsFromPercent(
  percent: number,
  totalFlour: number,
): number | null {
  if (!(totalFlour > 0) || !Number.isFinite(percent)) {
    return null;
  }
  return (percent / 100) * totalFlour;
}
