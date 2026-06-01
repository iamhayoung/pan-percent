import { StyleSheet, Text, View } from "react-native";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

export default function SettingsScreen() {
  const { t } = useT();
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={{ color: theme.colors.textPrimary }}>
        {t("tabSettings")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
