export type Ingredient = {
  id: string;
  name: string;
  grams: number;
  isFlour: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  memo?: string;
  photoUri?: string;
  yield?: string;
  tags: string[];
  bake?: { temperatureC?: number; minutes?: number };
  createdAt: number;
  updatedAt: number;
};

export type RecipeDraft = Omit<Recipe, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};
