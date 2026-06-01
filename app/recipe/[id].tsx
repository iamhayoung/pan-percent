import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { BakerPercentTable } from "@/components/recipe/BakerPercentTable";
import { ScaleControl } from "@/components/recipe/ScaleControl";
import { useT } from "@/lib/i18n/LanguageProvider";
import { remove } from "@/lib/recipes/recipeRepository";
import { useRecipe } from "@/lib/recipes/useRecipe";
import { useTheme } from "@/lib/theme/useTheme";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const theme = useTheme();
  const router = useRouter();
  const { recipe } = useRecipe(id);

  if (!recipe) {
    return (
      <View
        style={[
          styles.container,
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

  const confirmDelete = () => {
    Alert.alert(t("deleteConfirmTitle"), undefined, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await remove(recipe.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {recipe.name}
      </Text>
      {recipe.tags.length > 0 && (
        <View style={styles.tags}>
          {recipe.tags.map((tag) => (
            <Text key={tag} style={{ color: theme.colors.textSecondary }}>
              {tag}
            </Text>
          ))}
        </View>
      )}
      {recipe.memo ? (
        <View style={styles.section}>
          <Text style={{ color: theme.colors.textSecondary }}>{t("memo")}</Text>
          <Text style={{ color: theme.colors.textPrimary }}>{recipe.memo}</Text>
        </View>
      ) : null}
      <BakerPercentTable ingredients={recipe.ingredients} />
      <ScaleControl ingredients={recipe.ingredients} />
      <Text
        accessibilityRole="button"
        onPress={confirmDelete}
        style={[styles.delete, { color: theme.colors.accent }]}
      >
        {t("delete")}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: "700" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { gap: 4 },
  delete: { paddingVertical: 12, fontWeight: "600" },
});
