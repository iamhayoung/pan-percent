import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import type { Recipe, RecipeDraft } from "@/types/recipe";

const STORAGE_KEY = "@pan-percent/recipes";

async function readAll(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return [];
  }
  const parsed: Recipe[] = JSON.parse(raw);
  return parsed;
}

async function writeAll(recipes: Recipe[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export async function list(): Promise<Recipe[]> {
  return readAll();
}

export async function get(id: string): Promise<Recipe | null> {
  const recipes = await readAll();
  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function save(draft: RecipeDraft): Promise<Recipe> {
  const recipes = await readAll();
  const now = Date.now();
  const index = draft.id
    ? recipes.findIndex((recipe) => recipe.id === draft.id)
    : -1;

  if (index >= 0) {
    const updated: Recipe = {
      ...draft,
      id: recipes[index].id,
      createdAt: recipes[index].createdAt,
      updatedAt: now,
    };
    const next = [...recipes];
    next[index] = updated;
    await writeAll(next);
    return updated;
  }

  const created: Recipe = {
    ...draft,
    id: draft.id ?? randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await writeAll([...recipes, created]);
  return created;
}

export async function remove(id: string): Promise<void> {
  const recipes = await readAll();
  await writeAll(recipes.filter((recipe) => recipe.id !== id));
}
