import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme/useTheme";

function iosMajorVersion(): number {
  if (Platform.OS !== "ios") return 0;
  const v = Platform.Version;
  if (typeof v === "number") return v;
  const parsed = Number.parseInt(String(v), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

const BAR_HEIGHT = Platform.select({
  ios: iosMajorVersion() >= 26 ? 60 : 44,
  android: 56,
  default: 44,
});

export function ScreenHeader({ title }: { title: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={[styles.bar, { height: BAR_HEIGHT }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { justifyContent: "center", paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: "600" },
});
