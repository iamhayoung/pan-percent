import { useHeaderHeight } from "@react-navigation/elements";
import { usePreventRemove } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useRef } from "react";
import {
  Alert,
  type AlertButton,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlourPanel } from "@/components/recipe/form/FlourPanel";
import { IngredientRow } from "@/components/recipe/form/IngredientRow";
import { PhotoPicker } from "@/components/recipe/form/PhotoPicker";
import { TagChips } from "@/components/recipe/form/TagChips";
import { bakerPercents } from "@/lib/bakers/calculate";
import { formatDateTime } from "@/lib/i18n/formatDate";
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
  const { t, language } = useT();
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const savedRef = useRef(false);
  const savingRef = useRef(false);

  const persist = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    await save(form.draft);
    savedRef.current = true;
  };

  usePreventRemove(form.dirty && !savedRef.current, ({ data }) => {
    const buttons: AlertButton[] = [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("discard"),
        style: "destructive",
        onPress: () => navigation.dispatch(data.action),
      },
    ];
    if (form.isValid) {
      buttons.push({
        text: t("save"),
        onPress: async () => {
          await persist();
          navigation.dispatch(data.action);
        },
      });
    }
    Alert.alert(t("unsavedTitle"), undefined, buttons);
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
          if (savingRef.current) return;
          savingRef.current = true;
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

  const canSave = form.dirty && form.isValid;
  const bottomPad = insets.bottom + 12;
  const saveBarHeight = 52 + bottomPad + 12;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
    >
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: saveBarHeight + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <PhotoPicker
          photoUri={form.draft.photoUri}
          onChange={form.setPhotoUri}
        />
        <TextInput
          testID="recipe-name"
          value={form.draft.name}
          onChangeText={form.setName}
          placeholder={t("recipeName")}
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.nameInput, { color: theme.colors.textPrimary }]}
        />
        {initial && (
          <Text
            testID="recipe-timestamp"
            style={[styles.timestamp, { color: theme.colors.textSecondary }]}
          >
            {t("lastUpdated").replace(
              "{date}",
              formatDateTime(initial.updatedAt, language),
            )}
          </Text>
        )}

        <FlourPanel
          flours={flours}
          totalFlour={form.totalFlour}
          onScaleTotal={form.scaleTotalFlour}
          onFlourGrams={form.setIngredientGrams}
          onFlourName={form.setIngredientName}
          onAddFlour={form.addFlour}
          onRemoveFlour={form.removeIngredient}
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
          {others.map((ingredient, index) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              percent={percentOf(ingredient.id)}
              percentEditable={form.totalFlour > 0}
              removable={index > 0}
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

        <TagChips tags={form.draft.tags} onChange={form.setTags} />

        <TextInput
          testID="recipe-yield"
          value={form.draft.yield ?? ""}
          onChangeText={form.setYield}
          placeholder={t("yieldPlaceholder")}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.field,
            {
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            },
          ]}
        />

        <View style={styles.bakeRow}>
          <TextInput
            testID="bake-temp"
            selectTextOnFocus
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
            selectTextOnFocus
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
            {
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            },
          ]}
        />

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

      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: bottomPad,
          },
        ]}
      >
        <Pressable
          testID="save-recipe"
          accessibilityRole="button"
          disabled={!canSave}
          onPress={handleSave}
          style={[
            styles.save,
            {
              backgroundColor: canSave
                ? theme.colors.accent
                : theme.colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: canSave
                ? theme.colors.accentText
                : theme.colors.textSecondary,
              fontWeight: "700",
              fontSize: theme.fontSize.lg,
            }}
          >
            {t("save")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 14 },
  saveBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
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
  timestamp: { fontSize: 12, marginTop: -4 },
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
