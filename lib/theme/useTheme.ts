import { useColorScheme } from "react-native";
import { type ColorScheme, type ColorTokens, getColors } from "./colors";
import { fontSize, radius, spacing } from "./tokens";

export type Theme = {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
};

export function useTheme(): Theme {
  const scheme: ColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  return { scheme, colors: getColors(scheme), spacing, radius, fontSize };
}
