import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import type { Recipe } from "@/types/recipe";
import { list } from "./recipeRepository";

export function useRecipes(): {
  recipes: Recipe[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setRecipes(await list());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { recipes, loading, reload };
}
