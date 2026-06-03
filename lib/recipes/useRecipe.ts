import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import type { Recipe } from "@/types/recipe";
import { get } from "./recipeRepository";

export function useRecipe(id: string): {
  recipe: Recipe | null;
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setRecipe(await get(id));
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { recipe, loading, reload };
}
