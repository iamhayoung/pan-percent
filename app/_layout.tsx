import { Stack } from "expo-router";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ title: "" }} />
      </Stack>
    </LanguageProvider>
  );
}
