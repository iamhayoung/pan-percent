import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
          style={[styles.thumb, { backgroundColor: theme.colors.border }]}
        />
      )}
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.colors.textPrimary }]}>
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
  body: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: "600" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
