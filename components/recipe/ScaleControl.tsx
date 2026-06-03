import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { scaleToFlour, totalFlour } from "@/lib/bakers/calculate";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";
import type { Ingredient } from "@/types/recipe";

export function ScaleControl({ ingredients }: { ingredients: Ingredient[] }) {
  const { t } = useT();
  const theme = useTheme();
  const flour = totalFlour(ingredients);
  const [target, setTarget] = useState(String(flour));
  const scaled = scaleToFlour(ingredients, Number(target));

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontWeight: "700",
          fontSize: theme.fontSize.lg,
        }}
      >
        {t("scaleTitle")}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.md,
        }}
      >
        {t("targetFlourGrams")}
      </Text>
      <TextInput
        accessibilityLabel={t("targetFlourGrams")}
        keyboardType="numeric"
        value={target}
        onChangeText={setTarget}
        editable={flour > 0}
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary,
            fontSize: theme.fontSize.lg,
          },
        ]}
      />
      {scaled === null ? (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.md,
          }}
        >
          {t("scaleUnavailable")}
        </Text>
      ) : (
        scaled.map((ingredient) => (
          <View key={ingredient.id} style={styles.row}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.lg,
              }}
            >
              {ingredient.name}
            </Text>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.lg,
              }}
            >
              {Math.round(ingredient.grams)}g
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
});
