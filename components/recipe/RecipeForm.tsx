import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlourPanel } from "@/components/recipe/form/FlourPanel";
import { IngredientRow } from "@/components/recipe/form/IngredientRow";
import { bakerPercents } from "@/lib/bakers/calculate";
import { useT } from "@/lib/i18n/LanguageProvider";
import { remove, save } from "@/lib/recipes/recipeRepository";
import { useRecipeForm } from "@/lib/recipes/useRecipeForm";
import { useTheme } from "@/lib/theme/useTheme";
import type { Recipe } from "@/types/recipe";

function toNumber(text: string): number {
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

export function RecipeForm({ initial }: { initial: Recipe | null }) {
  const form = useRecipeForm(initial);
  const { t } = useT();
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const savedRef = useRef(false);

  const persist = async () => {
    await save(form.draft);
    savedRef.current = true;
  };

  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", (e) => {
      if (!form.dirty || savedRef.current) {
        return;
      }
      e.preventDefault();
      Alert.alert(t("unsavedTitle"), undefined, [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("discard"),
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
        {
          text: t("save"),
          onPress: async () => {
            await persist();
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return sub;
  });

  const handleSave = async () => {
    await persist();
    router.back();
  };

  const handleDelete = () => {
    if (initial === null) {
      return;
    }
    Alert.alert(t("deleteConfirmTitle"), undefined, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await remove(initial.id);
          savedRef.current = true;
          router.back();
        },
      },
    ]);
  };

  const flours = form.draft.ingredients.filter((i) => i.isFlour);
  const others = form.draft.ingredients.filter((i) => !i.isFlour);
  const percents = bakerPercents(form.draft.ingredients);
  const percentOf = (id: string) =>
    percents.find((p) => p.id === id)?.percent ?? null;
  const bake = form.draft.bake;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        testID="recipe-name"
        value={form.draft.name}
        onChangeText={form.setName}
        placeholder={t("recipeName")}
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.nameInput, { color: theme.colors.textPrimary }]}
      />

      <FlourPanel
        flours={flours}
        totalFlour={form.totalFlour}
        onScaleTotal={form.scaleTotalFlour}
        onFlourGrams={form.setIngredientGrams}
        onFlourName={form.setIngredientName}
        onAddFlour={form.addFlour}
      />

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
          {t("ingredients")}
        </Text>
        {others.map((ingredient) => (
          <IngredientRow
            key={ingredient.id}
            ingredient={ingredient}
            percent={percentOf(ingredient.id)}
            onName={(name) => form.setIngredientName(ingredient.id, name)}
            onGrams={(grams) => form.setIngredientGrams(ingredient.id, grams)}
            onPercent={(p) => form.setIngredientPercent(ingredient.id, p)}
            onRemove={() => form.removeIngredient(ingredient.id)}
          />
        ))}
        <Pressable
          testID="add-ingredient"
          accessibilityRole="button"
          onPress={form.addIngredient}
          style={[styles.addRow, { borderColor: theme.colors.border }]}
        >
          <Text style={{ color: theme.colors.accent }}>
            ＋ {t("addIngredient")}
          </Text>
        </Pressable>
      </View>

      <TextInput
        testID="tags-input"
        value={form.draft.tags.join(", ")}
        onChangeText={(x) =>
          form.setTags(
            x
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        placeholder={t("tags")}
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.field,
          { color: theme.colors.textPrimary, borderColor: theme.colors.border },
        ]}
      />

      <View style={styles.bakeRow}>
        <TextInput
          testID="bake-temp"
          value={bake?.temperatureC != null ? String(bake.temperatureC) : ""}
          keyboardType="numeric"
          onChangeText={(x) =>
            form.setBake({
              ...bake,
              temperatureC: x === "" ? undefined : toNumber(x),
            })
          }
          placeholder={t("temperatureC")}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.field,
            styles.bakeField,
            {
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            },
          ]}
        />
        <TextInput
          testID="bake-min"
          value={bake?.minutes != null ? String(bake.minutes) : ""}
          keyboardType="numeric"
          onChangeText={(x) =>
            form.setBake({
              ...bake,
              minutes: x === "" ? undefined : toNumber(x),
            })
          }
          placeholder={t("minutes")}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.field,
            styles.bakeField,
            {
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            },
          ]}
        />
      </View>

      <TextInput
        testID="memo-input"
        value={form.draft.memo ?? ""}
        onChangeText={form.setMemo}
        placeholder={t("memo")}
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        style={[
          styles.field,
          styles.memo,
          { color: theme.colors.textPrimary, borderColor: theme.colors.border },
        ]}
      />

      {form.dirty && (
        <Pressable
          testID="save-recipe"
          accessibilityRole="button"
          onPress={handleSave}
          style={[styles.save, { backgroundColor: theme.colors.accent }]}
        >
          <Text
            style={{
              color: theme.colors.accentText,
              fontWeight: "700",
              fontSize: theme.fontSize.lg,
            }}
          >
            {t("save")}
          </Text>
        </Pressable>
      )}

      {initial !== null && (
        <Pressable
          testID="delete-recipe"
          accessibilityRole="button"
          accessibilityLabel={t("delete")}
          onPress={handleDelete}
          style={[styles.delete, { borderColor: theme.colors.danger }]}
        >
          <Text style={{ color: theme.colors.danger, fontWeight: "600" }}>
            {t("delete")}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  nameInput: { fontSize: 22, fontWeight: "700", paddingVertical: 6 },
  panel: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  label: { fontSize: 12 },
  addRow: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  bakeRow: { flexDirection: "row", gap: 10 },
  bakeField: { flex: 1 },
  memo: { minHeight: 72, textAlignVertical: "top" },
  save: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  delete: {
    alignSelf: "flex-start",
    minHeight: 44,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
});
