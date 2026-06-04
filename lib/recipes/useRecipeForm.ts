import { randomUUID } from "expo-crypto";
import { useRef, useState } from "react";
import {
  gramsFromPercent,
  scaleToFlour,
  totalFlour,
} from "@/lib/bakers/calculate";
import type { Ingredient, Recipe, RecipeDraft } from "@/types/recipe";

type Bake = { temperatureC?: number; minutes?: number };

export type RecipeFormApi = {
  draft: RecipeDraft;
  dirty: boolean;
  totalFlour: number;
  setName: (name: string) => void;
  setIngredientName: (id: string, name: string) => void;
  setIngredientGrams: (id: string, grams: number) => void;
  setIngredientPercent: (id: string, percent: number) => void;
  addFlour: () => void;
  addIngredient: () => void;
  removeIngredient: (id: string) => void;
  scaleTotalFlour: (targetGrams: number) => void;
  setTags: (tags: string[]) => void;
  setBake: (bake: Bake | undefined) => void;
  setMemo: (memo: string) => void;
};

function newIngredient(isFlour: boolean): Ingredient {
  return { id: randomUUID(), name: "", grams: 0, isFlour };
}

function toDraft(initial: Recipe | null): RecipeDraft {
  if (initial === null) {
    return { name: "", ingredients: [newIngredient(true)], tags: [] };
  }
  return {
    id: initial.id,
    name: initial.name,
    ingredients: initial.ingredients,
    tags: initial.tags,
    memo: initial.memo,
    photoUri: initial.photoUri,
    bake: initial.bake,
  };
}

export function useRecipeForm(initial: Recipe | null): RecipeFormApi {
  const [draft, setDraft] = useState<RecipeDraft>(() => toDraft(initial));
  const initialSnapshot = useRef(JSON.stringify(draft));
  const dirty = JSON.stringify(draft) !== initialSnapshot.current;
  const total = totalFlour(draft.ingredients);

  const patchIngredient = (id: string, patch: Partial<Ingredient>) =>
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    }));

  return {
    draft,
    dirty,
    totalFlour: total,
    setName: (name) => setDraft((d) => ({ ...d, name })),
    setIngredientName: (id, name) => patchIngredient(id, { name }),
    setIngredientGrams: (id, grams) => patchIngredient(id, { grams }),
    setIngredientPercent: (id, percent) => {
      const grams = gramsFromPercent(percent, total);
      if (grams !== null) {
        patchIngredient(id, { grams });
      }
    },
    addFlour: () =>
      setDraft((d) => ({
        ...d,
        ingredients: [...d.ingredients, newIngredient(true)],
      })),
    addIngredient: () =>
      setDraft((d) => ({
        ...d,
        ingredients: [...d.ingredients, newIngredient(false)],
      })),
    removeIngredient: (id) =>
      setDraft((d) => ({
        ...d,
        ingredients: d.ingredients.filter((i) => i.id !== id),
      })),
    scaleTotalFlour: (targetGrams) => {
      const scaled = scaleToFlour(draft.ingredients, targetGrams);
      if (scaled) {
        setDraft((d) => ({ ...d, ingredients: scaled }));
      }
    },
    setTags: (tags) => setDraft((d) => ({ ...d, tags })),
    setBake: (bake) => setDraft((d) => ({ ...d, bake })),
    setMemo: (memo) => setDraft((d) => ({ ...d, memo })),
  };
}
