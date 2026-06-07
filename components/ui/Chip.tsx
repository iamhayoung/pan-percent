import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

export type ChipSize = "small" | "default";

export const CHIP_HEIGHT_DEFAULT = 30;
export const CHIP_HEIGHT_SMALL = 24;

const SIZE_MAP: Record<
  ChipSize,
  { height: number; fontSize: number; iconSize: number; paddingLeft: number }
> = {
  small: {
    height: CHIP_HEIGHT_SMALL,
    fontSize: 12,
    iconSize: 12,
    paddingLeft: 10,
  },
  default: {
    height: CHIP_HEIGHT_DEFAULT,
    fontSize: 14,
    iconSize: 14,
    paddingLeft: 12,
  },
};

type Props = {
  label: string;
  testID?: string;
  size?: ChipSize;
  onRemove?: () => void;
  removeTestID?: string;
};

export function Chip({
  label,
  testID,
  size = "default",
  onRemove,
  removeTestID,
}: Props) {
  const theme = useTheme();
  const { t } = useT();
  const sizing = SIZE_MAP[size];

  return (
    <View
      testID={testID}
      style={[
        styles.chip,
        {
          backgroundColor: `${theme.colors.accent}26`,
          height: sizing.height,
          paddingLeft: sizing.paddingLeft,
          paddingRight: onRemove ? sizing.paddingLeft - 4 : sizing.paddingLeft,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { fontSize: sizing.fontSize, color: theme.colors.accent },
        ]}
      >
        {label}
      </Text>
      {onRemove && (
        <Pressable
          testID={removeTestID}
          accessibilityRole="button"
          accessibilityLabel={t("delete")}
          onPress={onRemove}
          style={styles.removeBtn}
          hitSlop={6}
        >
          <Ionicons
            name="close"
            size={sizing.iconSize}
            color={theme.colors.accent}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    gap: 4,
  },
  label: {},
  removeBtn: { padding: 2 },
});
