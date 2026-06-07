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
  onRemoveFlour,
}: {
  flours: Ingredient[];
  totalFlour: number;
  onScaleTotal: (grams: number) => void;
  onFlourGrams: (id: string, grams: number) => void;
  onFlourName: (id: string, name: string) => void;
  onAddFlour: () => void;
  onRemoveFlour: (id: string) => void;
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
          disabled={totalFlour <= 0}
          onPress={() => onScaleTotal(Math.max(0, totalFlour - STEP))}
          style={[
            styles.stepBtn,
            {
              backgroundColor:
                totalFlour <= 0 ? theme.colors.border : theme.colors.accent,
            },
          ]}
        >
          <Ionicons
            name="remove"
            size={24}
            color={
              totalFlour <= 0
                ? theme.colors.textSecondary
                : theme.colors.accentText
            }
          />
        </Pressable>
        <View style={styles.totalWrap}>
          <TextInput
            testID="total-flour-input"
            textAlign="right"
            selectTextOnFocus
            value={totalFlour > 0 ? String(totalFlour) : ""}
            keyboardType="numeric"
            onChangeText={(x) => onScaleTotal(toNumber(x))}
            placeholder="0"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.total, { color: theme.colors.textPrimary }]}
          />
          <Text
            style={[styles.totalUnit, { color: theme.colors.textSecondary }]}
          >
            g
          </Text>
        </View>
        <Pressable
          testID="flour-plus"
          accessibilityRole="button"
          disabled={totalFlour <= 0}
          onPress={() => onScaleTotal(totalFlour + STEP)}
          style={[
            styles.stepBtn,
            {
              backgroundColor:
                totalFlour <= 0 ? theme.colors.border : theme.colors.accent,
            },
          ]}
        >
          <Ionicons
            name="add"
            size={24}
            color={
              totalFlour <= 0
                ? theme.colors.textSecondary
                : theme.colors.accentText
            }
          />
        </Pressable>
      </View>

      <View style={[styles.divider, { borderTopColor: theme.colors.border }]} />

      {flours.map((f, index) => (
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
            <>
              <TextInput
                testID={`flour-grams-${f.id}`}
                textAlign="right"
                selectTextOnFocus
                value={f.grams > 0 ? String(f.grams) : ""}
                keyboardType="numeric"
                onChangeText={(x) => onFlourGrams(f.id, toNumber(x))}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.flourGrams, { color: theme.colors.textPrimary }]}
              />
              <Text
                style={[
                  styles.flourUnit,
                  { color: theme.colors.textSecondary },
                ]}
              >
                g
              </Text>
            </>
          )}
          {blended && (
            <Pressable
              testID={`remove-flour-${f.id}`}
              accessibilityRole="button"
              accessibilityLabel={t("delete")}
              disabled={index === 0}
              onPress={() => onRemoveFlour(f.id)}
              style={styles.removeFlour}
            >
              <Ionicons
                name="close"
                size={20}
                color={index === 0 ? theme.colors.border : theme.colors.danger}
              />
            </Pressable>
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
  totalWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
  },
  total: { minWidth: 60, fontSize: 26, fontWeight: "700" },
  totalUnit: { fontSize: 16 },
  divider: { borderTopWidth: 1 },
  flourRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flourName: { flex: 1, fontSize: 16, paddingVertical: 8 },
  flourGrams: {
    width: 60,
    fontSize: 16,
    paddingVertical: 8,
  },
  flourUnit: { fontSize: 14 },
  removeFlour: { padding: 6 },
  addFlour: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
});
