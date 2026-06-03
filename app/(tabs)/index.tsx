import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { useT } from "@/lib/i18n/LanguageProvider";
import { remove, save } from "@/lib/recipes/recipeRepository";
import { useRecipes } from "@/lib/recipes/useRecipes";
import { useTheme } from "@/lib/theme/useTheme";
import type { Recipe, RecipeDraft } from "@/types/recipe";

// HACK: temporary dev seed. Replace with router.push("/recipe/new") in feature/recipe-form.
const SAMPLE: RecipeDraft = {
  name: "Sample bread",
  ingredients: [
    { id: "flour", name: "Bread flour", grams: 500, isFlour: true },
    { id: "water", name: "Water", grams: 350, isFlour: false },
    { id: "salt", name: "Salt", grams: 10, isFlour: false },
  ],
  tags: ["sample"],
};

export default function RecipesScreen() {
  const { t } = useT();
  const theme = useTheme();
  const router = useRouter();
  const { recipes, reload } = useRecipes();

  const addSample = async () => {
    await save(SAMPLE);
    await reload();
  };

  const deleteRecipe = async (id: string) => {
    await remove(id);
    await reload();
  };

  const renderItem = ({ item }: { item: Recipe }) => (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          testID={`delete-recipe-${item.id}`}
          accessibilityRole="button"
          accessibilityLabel={t("delete")}
          onPress={() => deleteRecipe(item.id)}
          style={[
            styles.deleteAction,
            { backgroundColor: theme.colors.danger },
          ]}
        >
          <Ionicons name="trash" size={24} color={theme.colors.dangerText} />
        </Pressable>
      )}
    >
      <RecipeCard
        recipe={item}
        onPress={() =>
          router.push({ pathname: "/recipe/[id]", params: { id: item.id } })
        }
      />
    </Swipeable>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.colors.textSecondary }}>
            {t("recipesEmpty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
        />
      )}
      <Pressable
        testID="add-recipe-fab"
        accessibilityLabel={t("addSampleRecipe")}
        accessibilityRole="button"
        onPress={addSample}
        style={[styles.fab, { backgroundColor: theme.colors.accent }]}
      >
        <Text style={[styles.fabPlus, { color: theme.colors.accentText }]}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    borderRadius: 12,
    marginLeft: 12,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPlus: { fontSize: 28, lineHeight: 32 },
});
