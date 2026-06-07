import { Stack } from "expo-router";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function NewRecipeScreen() {
  const { t } = useT();
  return (
    <>
      <Stack.Screen options={{ title: t("newRecipe") }} />
      <RecipeForm initial={null} />
    </>
  );
}
