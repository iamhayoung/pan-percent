import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";
import type { Ingredient } from "@/types/recipe";

const STEP = 10;

function toNumber(text: string): number {
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

export function FlourPanel({
  flours,
  totalFlour,
  onScaleTotal,
  onFlourGrams,
  onFlourName,
  onAddFlour,
}: {
  flours: Ingredient[];
  totalFlour: number;
  onScaleTotal: (grams: number) => void;
  onFlourGrams: (id: string, grams: number) => void;
  onFlourName: (id: string, name: string) => void;
  onAddFlour: () => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const blended = flours.length > 1;

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {t("targetAmount")}
      </Text>

      <View style={styles.stepper}>
        <Pressable
          testID="flour-minus"
          accessibilityRole="button"
          onPress={() => onScaleTotal(Math.max(0, totalFlour - STEP))}
          style={[styles.stepBtn, { backgroundColor: theme.colors.accent }]}
        >
          <Ionicons name="remove" size={24} color={theme.colors.accentText} />
        </Pressable>
        <TextInput
          testID="total-flour-input"
          value={String(totalFlour)}
          keyboardType="numeric"
          onChangeText={(x) => onScaleTotal(toNumber(x))}
          style={[styles.total, { color: theme.colors.textPrimary }]}
        />
        <Pressable
          testID="flour-plus"
          accessibilityRole="button"
          onPress={() => onScaleTotal(totalFlour + STEP)}
          style={[styles.stepBtn, { backgroundColor: theme.colors.accent }]}
        >
          <Ionicons name="add" size={24} color={theme.colors.accentText} />
        </Pressable>
      </View>

      <View style={[styles.divider, { borderTopColor: theme.colors.border }]} />

      {flours.map((f) => (
        <View key={f.id} style={styles.flourRow}>
          <TextInput
            testID={`flour-name-${f.id}`}
            value={f.name}
            onChangeText={(x) => onFlourName(f.id, x)}
            placeholder={t("flour")}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.flourName, { color: theme.colors.textPrimary }]}
          />
          {blended && (
            <TextInput
              testID={`flour-grams-${f.id}`}
              value={String(f.grams)}
              keyboardType="numeric"
              onChangeText={(x) => onFlourGrams(f.id, toNumber(x))}
              style={[styles.flourGrams, { color: theme.colors.textPrimary }]}
            />
          )}
        </View>
      ))}

      <Pressable
        testID="add-flour"
        accessibilityRole="button"
        onPress={onAddFlour}
        style={[styles.addFlour, { borderColor: theme.colors.border }]}
      >
        <Text
          style={{ color: theme.colors.accent, fontSize: theme.fontSize.sm }}
        >
          ＋ {t("addFlour")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  label: { fontSize: 12 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  total: { flex: 1, fontSize: 26, fontWeight: "700", textAlign: "center" },
  divider: { borderTopWidth: 1 },
  flourRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flourName: { flex: 1, fontSize: 16, paddingVertical: 8 },
  flourGrams: {
    width: 72,
    fontSize: 16,
    textAlign: "right",
    paddingVertical: 8,
  },
  addFlour: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
});
