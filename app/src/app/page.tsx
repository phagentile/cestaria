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

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  const { users, loadAll } = useAdminStore();
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Cestaria</CardTitle>
          <p className="text-muted-foreground text-sm">
            Mesa de Controle de Rugby
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o operador</label>
            <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} (
                    {u.role === "gestor" ? "Gestor" : "4o Arbitro"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={!selectedUserId}
          >
            Entrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
