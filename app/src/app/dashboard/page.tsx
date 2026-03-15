"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { db } from "@/lib/db";
import type { Match } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, Settings, Play } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, hasPermission } = useAuthStore();
  const { clubs, loadAll } = useAdminStore();
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    loadAll();
    db.matches.toArray().then(setMatches);
  }, [user, router, loadAll]);

  if (!user) return null;

  const getClubName = (id: string) =>
    clubs.find((c) => c.id === id)?.name ?? "—";

  const statusLabel: Record<string, string> = {
    scheduled: "Agendada",
    live: "Ao Vivo",
    finished: "Encerrada",
    reopened: "Reaberta",
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case "live":
        return "default" as const;
      case "finished":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Cestaria</h1>
          <p className="text-xs text-muted-foreground">
            {user.name} — {user.role === "gestor" ? "Gestor" : "4o Arbitro"}
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission("manage_master_data") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin")}
            >
              <Settings className="w-4 h-4 mr-1" />
              Cadastros
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="w-4 h-4 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Partidas</h2>
          {hasPermission("create_match") && (
            <Button onClick={() => router.push("/match/new")}>
              <Plus className="w-4 h-4 mr-1" />
              Nova Partida
            </Button>
          )}
        </div>

        {matches.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma partida criada.
              {hasPermission("create_match") &&
                " Clique em 'Nova Partida' para comecar."}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {matches
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((m) => (
              <Card
                key={m.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => router.push(`/match/${m.id}`)}
              >
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {getClubName(m.homeClubId)}
                      </span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="font-semibold">
                        {getClubName(m.awayClubId)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.competitionName && `${m.competitionName} • `}
                      {m.matchDate ?? "Sem data"}
                      {m.venue && ` • ${m.venue}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(m.status)}>
                      {statusLabel[m.status] ?? m.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </main>
    </div>
  );
}
