import type { Language } from "./translations";

const LOCALE_MAP: Record<Language, string> = {
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
};

export function formatDateTime(timestamp: number, language: Language): string {
  return new Date(timestamp).toLocaleString(LOCALE_MAP[language], {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
