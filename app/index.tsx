import { Text, View } from "react-native";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

export default function Index() {
  const { t } = useT();
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{ color: theme.colors.textPrimary, fontSize: theme.fontSize.xl }}
      >
        {t("appName")}
      </Text>
    </View>
  );
}
