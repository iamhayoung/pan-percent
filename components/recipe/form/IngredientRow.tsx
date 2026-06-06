import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";
import type { Ingredient } from "@/types/recipe";

function toNumber(text: string): number {
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function formatPercent(percent: number | null): string {
  if (percent === null) {
    return "";
  }
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
}

export function IngredientRow({
  ingredient,
  percent,
  onName,
  onGrams,
  onPercent,
  onRemove,
}: {
  ingredient: Ingredient;
  percent: number | null;
  onName: (name: string) => void;
  onGrams: (grams: number) => void;
  onPercent: (percent: number) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const id = ingredient.id;

  return (
    <View style={[styles.row, { borderTopColor: theme.colors.border }]}>
      <TextInput
        testID={`ingredient-name-${id}`}
        value={ingredient.name}
        onChangeText={onName}
        placeholder={t("ingredients")}
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.name, { color: theme.colors.textPrimary }]}
      />
      <TextInput
        testID={`ingredient-grams-${id}`}
        value={String(ingredient.grams)}
        keyboardType="numeric"
        onChangeText={(x) => onGrams(toNumber(x))}
        style={[styles.num, { color: theme.colors.textPrimary }]}
      />
      <TextInput
        testID={`ingredient-percent-${id}`}
        value={formatPercent(percent)}
        keyboardType="numeric"
        onChangeText={(x) => onPercent(toNumber(x))}
        style={[styles.num, { color: theme.colors.textSecondary }]}
      />
      <Pressable
        testID={`remove-ingredient-${id}`}
        accessibilityRole="button"
        accessibilityLabel={t("delete")}
        onPress={onRemove}
        style={styles.remove}
      >
        <Ionicons name="close" size={20} color={theme.colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  name: { flex: 1, fontSize: 16, paddingVertical: 8 },
  num: { width: 64, fontSize: 16, textAlign: "right", paddingVertical: 8 },
  remove: { padding: 6 },
});
