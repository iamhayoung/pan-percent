import {
  DarkTheme,
  DefaultTheme,
  type Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

function ThemedStack() {
  const theme = useTheme();
  const base = theme.scheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      primary: theme.colors.accent,
      border: theme.colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: "minimal",
          headerBackTitle: "",
          headerLargeTitle: false,
          title: "",
          headerTitleStyle: { fontSize: 18, fontWeight: "600" },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "" }}
        />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="recipe/new" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <ThemedStack />
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
