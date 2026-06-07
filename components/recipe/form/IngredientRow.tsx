import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
  percentEditable,
  removable,
  onName,
  onGrams,
  onPercent,
  onRemove,
}: {
  ingredient: Ingredient;
  percent: number | null;
  percentEditable: boolean;
  removable: boolean;
  onName: (name: string) => void;
  onGrams: (grams: number) => void;
  onPercent: (percent: number) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const id = ingredient.id;
  const percentColor = percentEditable
    ? theme.colors.textPrimary
    : theme.colors.textSecondary;

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
      <View style={styles.numWrap}>
        <TextInput
          testID={`ingredient-grams-${id}`}
          textAlign="right"
          selectTextOnFocus
          value={ingredient.grams > 0 ? String(ingredient.grams) : ""}
          keyboardType="numeric"
          onChangeText={(x) => onGrams(toNumber(x))}
          placeholder="0"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.num, { color: theme.colors.textPrimary }]}
        />
        <Text style={[styles.unit, { color: theme.colors.textSecondary }]}>
          g
        </Text>
      </View>
      <View style={styles.numWrap}>
        <TextInput
          testID={`ingredient-percent-${id}`}
          textAlign="right"
          selectTextOnFocus
          editable={percentEditable}
          value={formatPercent(percent)}
          keyboardType="numeric"
          onChangeText={(x) => onPercent(toNumber(x))}
          placeholder={percentEditable ? "0" : "—"}
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.num, { color: percentColor }]}
        />
        <Text style={[styles.unit, { color: theme.colors.textSecondary }]}>
          %
        </Text>
      </View>
      <Pressable
        testID={`remove-ingredient-${id}`}
        accessibilityRole="button"
        accessibilityLabel={t("delete")}
        disabled={!removable}
        onPress={onRemove}
        style={styles.remove}
      >
        <Ionicons
          name="close"
          size={20}
          color={removable ? theme.colors.danger : theme.colors.border}
        />
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
  numWrap: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  num: { width: 48, fontSize: 16, paddingVertical: 8 },
  unit: { fontSize: 14 },
  remove: { padding: 6 },
});
