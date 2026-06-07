import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CHIP_HEIGHT_DEFAULT, Chip } from "@/components/ui/Chip";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

export function TagChips({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const text = draft.trim();
    setDraft("");
    setAdding(false);
    if (text === "" || tags.includes(text)) {
      return;
    }
    onChange([...tags, text]);
  };

  const removeAt = (target: string) => {
    onChange(tags.filter((tag) => tag !== target));
  };

  return (
    <View style={styles.wrap}>
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          testID={`tag-${tag}`}
          onRemove={() => removeAt(tag)}
          removeTestID={`remove-tag-${tag}`}
        />
      ))}
      {adding ? (
        <TextInput
          testID="tag-input"
          value={draft}
          onChangeText={setDraft}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={commit}
          onBlur={commit}
          placeholder={t("tags")}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              borderColor: theme.colors.accent,
            },
          ]}
        />
      ) : (
        <Pressable
          testID="add-tag"
          accessibilityRole="button"
          accessibilityLabel={t("addTag")}
          onPress={() => setAdding(true)}
          style={[
            styles.addBtn,
            { height: CHIP_HEIGHT_DEFAULT, borderColor: theme.colors.accent },
          ]}
        >
          <Text
            style={{ color: theme.colors.accent, fontSize: theme.fontSize.sm }}
          >
            ＋ {t("addTag")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  addBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: CHIP_HEIGHT_DEFAULT,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 0,
    minWidth: 100,
    fontSize: 14,
    textAlignVertical: "center",
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
});
