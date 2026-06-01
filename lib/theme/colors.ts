export const lightColors = {
  background: "#FBF7F0",
  surface: "#FFFFFF",
  textPrimary: "#2B2420",
  textSecondary: "#6B5E54",
  accent: "#C0612F",
  accentText: "#FFFFFF",
  border: "#E7DECF",
} as const;

export const darkColors = {
  background: "#1A1714",
  surface: "#241F1B",
  textPrimary: "#F2EADF",
  textSecondary: "#B8A99B",
  accent: "#E08A52",
  accentText: "#1A1714",
  border: "#3A322B",
} as const;

export type ColorScheme = "light" | "dark";
export type ColorTokens = { readonly [K in keyof typeof lightColors]: string };

export function getColors(scheme: ColorScheme): ColorTokens {
  return scheme === "dark" ? darkColors : lightColors;
}
