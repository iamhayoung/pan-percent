import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

export default function TabsLayout() {
  const { t } = useT();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabRecipes"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabSettings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
