import { getLocales } from "expo-localization";
import { type Language, translations } from "./translations";

const SUPPORTED = Object.keys(translations) as Language[];
const FALLBACK: Language = "en";

export function resolveLanguage(languageCodes: (string | null)[]): Language {
  for (const code of languageCodes) {
    const lang = code?.slice(0, 2).toLowerCase();
    if (lang && (SUPPORTED as string[]).includes(lang)) {
      return lang as Language;
    }
  }
  return FALLBACK;
}

export function getDeviceLanguage(): Language {
  return resolveLanguage(getLocales().map((locale) => locale.languageCode));
}
