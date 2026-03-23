"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { useMatchStore } from "@/stores/match-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";

export default function NewMatchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { clubs, gameTypes, categories, loadAll } = useAdminStore();
  const { createMatch } = useMatchStore();

  const [homeClubId, setHomeClubId] = useState("");
  const [awayClubId, setAwayClubId] = useState("");
  const [gameTypeId, setGameTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [competitionName, setCompetitionName] = useState("");
  const [organizingEntities, setOrganizingEntities] = useState<string[]>([]);
  const [venue, setVenue] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    loadAll();
  }, [user, router, loadAll]);

  const canCreate =
    homeClubId && awayClubId && gameTypeId && homeClubId !== awayClubId;

  const handleCreate = async () => {
    if (!canCreate) return;
    const id = await createMatch({
      homeClubId,
      awayClubId,
      gameTypeId,
      categoryId: categoryId || undefined,
      competitionName: competitionName || undefined,
      organizingEntities: organizingEntities.length > 0 ? organizingEntities : undefined,
      venue: venue || undefined,
      matchDate: matchDate || undefined,
    });
    router.push(`/match/${id}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold">Nova Partida</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuracao da Partida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Time da Casa *</Label>
                <Select value={homeClubId} onValueChange={(v) => setHomeClubId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Time Visitante *</Label>
                <Select value={awayClubId} onValueChange={(v) => setAwayClubId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs
                      .filter((c) => c.id !== homeClubId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo de Jogo *</Label>
                <Select value={gameTypeId} onValueChange={(v) => setGameTypeId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameTypes.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Competicao</Label>
              <Input
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="Nome da competicao"
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Entidades organizadoras</p>
                {[
                  { value: "World Rugby", level: "Mundial" },
                  { value: "Sudamerica Rugby", level: "Continental" },
                  { value: "Brasil Rugby", level: "País" },
                  { value: "FPR", level: "Estado" },
                  { value: "Liga do Vale", level: "Regional" },
                ].map(({ value, level }) => {
                  const checked = organizingEntities.includes(value);
                  return (
                    <label
                      key={value}
                      className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setOrganizingEntities((prev) =>
                            checked ? prev.filter((e) => e !== value) : [...prev, value]
                          )
                        }
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm flex-1">{value}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{level}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Local</Label>
                <Input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Estadio / campo"
                />
              </div>
              <div className="space-y-1">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                />
              </div>
            </div>

            <Button
              className="w-full mt-4"
              disabled={!canCreate}
              onClick={() => setShowConfirm(true)}
            >
              Criar Partida
            </Button>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar criacao?</AlertDialogTitle>
            <AlertDialogDescription>
              A partida sera criada e voce sera redirecionado para a mesa de
              controle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
