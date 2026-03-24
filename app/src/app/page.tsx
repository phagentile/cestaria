"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { useI18n } from "@/lib/i18n";
import { Trophy, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithPassword } = useAuthStore();
  const { loadAll } = useAdminStore();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true);
    setError(false);
    try {
      const ok = await loginWithPassword(email, password);
      if (ok) {
        router.push("/dashboard");
      } else {
        setError(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 relative">
      {/* Theme + Locale toggles */}
      <div className="absolute top-4 right-4 flex gap-2 items-center">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--rugby-try)] to-[var(--primary)] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("app.name")}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{t("app.subtitle")}</p>
        </div>

        <Card className="border border-[var(--border)] shadow-xl">
          <CardHeader className="pb-2">
            <p className="text-sm text-[var(--muted-foreground)] text-center">
              {t("auth.welcome")} <span className="font-semibold text-[var(--foreground)]">{t("app.name")}</span>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.email_placeholder")}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(false); }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.password_placeholder")}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {t("auth.invalid")}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!email || !password || busy}
              >
                {busy ? t("ui.loading") : t("auth.login")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
