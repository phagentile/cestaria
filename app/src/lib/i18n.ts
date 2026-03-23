"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pt } from "./translations/pt";
import { en } from "./translations/en";
import { es } from "./translations/es";

export type Locale = "pt" | "en" | "es";

type Translations = Record<string, string>;
const TRANSLATIONS: Record<Locale, Translations> = { pt, en, es };

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: "pt",
      setLocale: (locale) => set({ locale }),
      t: (key) => {
        const dict = TRANSLATIONS[get().locale];
        return dict[key] ?? key;
      },
    }),
    { name: "rugby-match-pro-locale" }
  )
);
