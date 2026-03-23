"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  const { users, loadAll } = useAdminStore();
  const { t } = useI18n();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogin = async () => {
    if (!selectedUserId) return;
    await login(selectedUserId);
    router.push("/dashboard");
  };

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("app.name")}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {t("app.subtitle")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("auth.select_operator")}</label>
            <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder={t("auth.select_operator")} />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{t("auth.no_users")}</div>
                ) : (
                  users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} (
                      {u.role === "gestor" ? "Gestor" : "4o Arbitro"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={!selectedUserId}
          >
            {t("auth.login")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
