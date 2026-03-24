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
import { Trophy, AlertCircle, Copy, Check, ArrowLeft, KeyRound } from "lucide-react";

type View = "login" | "forgot" | "reset_done";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithPassword, resetPassword } = useAuthStore();
  const { loadAll } = useAdminStore();
  const { t } = useI18n();

  const [view, setView] = useState<View>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (user) router.push("/dashboard"); }, [user, router]);

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

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || busy) return;
    setBusy(true);
    setForgotError(false);
    try {
      const newPass = await resetPassword(forgotEmail);
      if (newPass) {
        setTempPassword(newPass);
        setView("reset_done");
      } else {
        setForgotError(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* LOGIN */}
        {view === "login" && (
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

                <Button type="submit" className="w-full" disabled={!email || !password || busy}>
                  {busy ? t("ui.loading") : t("auth.login")}
                </Button>

                <button
                  type="button"
                  className="w-full text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-center py-1"
                  onClick={() => { setView("forgot"); setForgotError(false); setForgotEmail(""); }}
                >
                  {t("auth.forgot_password")}
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* FORGOT PASSWORD */}
        {view === "forgot" && (
          <Card className="border border-[var(--border)] shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("login")}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <p className="text-sm font-semibold text-[var(--foreground)]">{t("auth.forgot_password")}</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t("auth.forgot_desc")}
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">{t("auth.email")}</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(false); }}
                    autoFocus
                  />
                </div>

                {forgotError && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {t("auth.email_not_found")}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={!forgotEmail || busy}>
                  {busy ? t("ui.loading") : t("auth.reset_password")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* RESET DONE — show temp password */}
        {view === "reset_done" && (
          <Card className="border border-[var(--border)] shadow-xl">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--rugby-try)]/20 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-[var(--rugby-try)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{t("auth.new_password_title")}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{t("auth.new_password_desc")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[var(--muted)] rounded-lg px-4 py-3">
                <span className="flex-1 font-mono font-bold text-lg tracking-widest text-[var(--foreground)] text-center">
                  {tempPassword}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shrink-0"
                  title={t("ui.copy")}
                >
                  {copied ? <Check className="w-4 h-4 text-[var(--rugby-try)]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setEmail(forgotEmail);
                  setPassword(tempPassword);
                  setView("login");
                }}
              >
                {t("auth.go_to_login")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
