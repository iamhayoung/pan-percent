import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useRecipe } from "@/lib/recipes/useRecipe";
import { useTheme } from "@/lib/theme/useTheme";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const theme = useTheme();
  const { recipe, loading } = useRecipe(id);

  if (loading) {
    return (
      <View
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
      />
    );
  }

  if (!recipe) {
    return (
      <View
        style={[
          styles.fill,
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={{ color: theme.colors.textSecondary }}>
          {t("recipesEmpty")}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: recipe.name }} />
      <RecipeForm initial={recipe} />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
});
