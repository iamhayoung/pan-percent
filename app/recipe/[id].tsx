import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
      <Text
        style={[
          styles.title,
          { color: theme.colors.textPrimary, fontSize: theme.fontSize.xxl },
        ]}
      >
        {recipe.name}
      </Text>
      {recipe.tags.length > 0 && (
        <View style={styles.tags}>
          {recipe.tags.map((tag) => (
            <Text
              key={tag}
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.fontSize.md,
              }}
            >
              {tag}
            </Text>
          ))}
        </View>
      )}
      {recipe.memo ? (
        <View style={styles.section}>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.md,
            }}
          >
            {t("memo")}
          </Text>
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.lg,
            }}
          >
            {recipe.memo}
          </Text>
        </View>
      ) : null}
      <BakerPercentTable ingredients={recipe.ingredients} />
      <ScaleControl ingredients={recipe.ingredients} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("delete")}
        onPress={confirmDelete}
        style={[styles.delete, { borderColor: theme.colors.danger }]}
      >
        <Ionicons name="trash" size={18} color={theme.colors.danger} />
        <Text
          style={{
            color: theme.colors.danger,
            fontWeight: "600",
            fontSize: theme.fontSize.md,
          }}
        >
          {t("delete")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 20 },
  title: { fontWeight: "700" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { gap: 6 },
  delete: {
    alignSelf: "flex-start",
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
});
