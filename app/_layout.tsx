import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]" options={{ title: "" }} />
        </Stack>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
