import { StyleSheet, Text, View } from "react-native";
import { bakerPercents } from "@/lib/bakers/calculate";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";
import type { Ingredient } from "@/types/recipe";

function formatPercent(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

export function BakerPercentTable({
  ingredients,
}: {
  ingredients: Ingredient[];
}) {
  const { t } = useT();
  const theme = useTheme();
  const percents = bakerPercents(ingredients);

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View style={styles.row}>
        <Text
          style={[
            styles.cellName,
            { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
          ]}
        >
          {t("ingredients")}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.md,
          }}
        >
          {t("bakerPercent")}
        </Text>
      </View>
      {ingredients.map((ingredient, index) => (
        <View
          key={ingredient.id}
          style={[styles.row, { borderTopColor: theme.colors.border }]}
        >
          <Text
            style={[
              styles.cellName,
              { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg },
            ]}
          >
            {ingredient.name}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.md,
            }}
          >
            {ingredient.grams}g
          </Text>
          <Text
            style={[
              styles.cellPercent,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.lg,
                fontWeight: "600",
              },
            ]}
          >
            {formatPercent(percents[index].percent)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
  },
  cellName: { flex: 1 },
  cellPercent: { minWidth: 64, textAlign: "right" },
});
