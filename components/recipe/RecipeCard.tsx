import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/ui/Chip";
import { buildListPreview } from "@/lib/recipes/listPreview";
import { useTheme } from "@/lib/theme/useTheme";
import type { Recipe } from "@/types/recipe";

export function RecipeCard({
  recipe,
  onPress,
}: {
  recipe: Recipe;
  onPress: () => void;
}) {
  const theme = useTheme();
  const preview = buildListPreview(recipe);

  return (
    <Pressable
      testID={`recipe-card-${recipe.id}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {recipe.photoUri ? (
        <Image source={{ uri: recipe.photoUri }} style={styles.thumb} />
      ) : (
        <View
          style={[
            styles.thumb,
            styles.thumbPlaceholder,
            { backgroundColor: theme.colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name="baguette"
            size={24}
            color={theme.colors.textSecondary}
          />
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.colors.textPrimary }]}>
          {recipe.name}
        </Text>
        {preview !== "" && (
          <Text
            testID={`recipe-preview-${recipe.id}`}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.preview, { color: theme.colors.textSecondary }]}
          >
            {preview}
          </Text>
        )}
        {recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 6 },
  name: { fontSize: 18, fontWeight: "600" },
  preview: { fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
