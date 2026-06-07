import { StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

export default function SettingsScreen() {
  const { t } = useT();
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScreenHeader title={t("tabSettings")} />
      <View style={styles.body}>
        <Text style={{ color: theme.colors.textSecondary }}>
          {t("tabSettings")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
});
