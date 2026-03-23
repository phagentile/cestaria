"use client";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "pt", label: "PT" },
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center gap-0.5 bg-[var(--muted)]/30 rounded-md p-0.5">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setLocale(value)}
          className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
            locale === value
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
