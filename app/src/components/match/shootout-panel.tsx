"use client";

import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Check, X } from "lucide-react";

export function ShootoutPanel() {
  const { match, shootoutKicks, roster, addShootoutKick } = useMatchStore();
  const { clubs } = useAdminStore();
  const [selectedRosterId, setSelectedRosterId] = useState("");

  if (!match) return null;

  const isLocked = match.status === "finished";
  const homeClub = clubs.find((c) => c.id === match.homeClubId);
  const awayClub = clubs.find((c) => c.id === match.awayClubId);

  const homeKicks = shootoutKicks.filter((k) => k.clubId === match.homeClubId);
  const awayKicks = shootoutKicks.filter((k) => k.clubId === match.awayClubId);

  const homeMade = homeKicks.filter((k) => k.result === "made").length;
  const awayMade = awayKicks.filter((k) => k.result === "made").length;

  // Determine whose turn it is (alternating, home starts)
  const totalKicks = shootoutKicks.length;
  const nextClubId =
    totalKicks % 2 === 0 ? match.homeClubId : match.awayClubId;
  const nextClub = nextClubId === match.homeClubId ? homeClub : awayClub;

  const currentRound = Math.floor(totalKicks / 2) + 1;
  const isSuddenDeath = currentRound > 5;

  const activePlayers = roster.filter(
    (r) => r.clubId === nextClubId && r.role !== "staff"
  );

  const handleKick = async (result: "made" | "missed") => {
    await addShootoutKick(nextClubId, result, selectedRosterId || undefined);
    setSelectedRosterId("");
  };

  const getPlayer = (rosterId?: string) =>
    rosterId ? roster.find((r) => r.id === rosterId) : null;

  return (
    <div className="space-y-4 mt-2">
      <div className="text-xs font-medium text-muted-foreground">
        DISPUTA DE PENAIS / DROPS
      </div>

      {/* Score */}
      <div className="text-center">
        <div className="text-3xl font-bold font-mono">
          {homeMade} - {awayMade}
        </div>
        <div className="text-xs text-muted-foreground">
          {homeClub?.acronym} vs {awayClub?.acronym}
        </div>
        {isSuddenDeath && (
          <Badge variant="destructive" className="mt-1 text-xs">
            Morte Subita
          </Badge>
        )}
      </div>

      {/* Kick History */}
      <div className="grid grid-cols-2 gap-4">
        {/* Home */}
        <div>
          <div className="text-xs font-medium mb-1">
            {homeClub?.name ?? "Casa"}
          </div>
          <div className="space-y-1">
            {homeKicks.map((kick, i) => {
              const player = getPlayer(kick.rosterId);
              return (
                <div key={kick.id} className="flex items-center gap-1 text-xs">
                  <span className="w-4 text-muted-foreground">{i + 1}.</span>
                  {kick.result === "made" ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <X className="w-3 h-3 text-red-500" />
                  )}
                  <span>
                    {player
                      ? `#${player.shirtNumber} ${player.playerName}`
                      : "—"}
                  </span>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 5 - homeKicks.length) }).map(
              (_, i) => (
                <div key={`h-empty-${i}`} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-4">{homeKicks.length + i + 1}.</span>
                  <span>—</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Away */}
        <div>
          <div className="text-xs font-medium mb-1">
            {awayClub?.name ?? "Visitante"}
          </div>
          <div className="space-y-1">
            {awayKicks.map((kick, i) => {
              const player = getPlayer(kick.rosterId);
              return (
                <div key={kick.id} className="flex items-center gap-1 text-xs">
                  <span className="w-4 text-muted-foreground">{i + 1}.</span>
                  {kick.result === "made" ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <X className="w-3 h-3 text-red-500" />
                  )}
                  <span>
                    {player
                      ? `#${player.shirtNumber} ${player.playerName}`
                      : "—"}
                  </span>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 5 - awayKicks.length) }).map(
              (_, i) => (
                <div key={`a-empty-${i}`} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-4">{awayKicks.length + i + 1}.</span>
                  <span>—</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Next Kick Controls */}
      {!isLocked && (
        <div className="border-t pt-3 space-y-2">
          <div className="text-xs text-muted-foreground">
            Rodada {currentRound} — Vez: <strong>{nextClub?.name}</strong>
          </div>

          <div className="space-y-1">
            <Select
              value={selectedRosterId}
              onValueChange={(v) => setSelectedRosterId(v ?? "")}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Jogador (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {activePlayers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    #{r.shirtNumber} {r.playerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
              onClick={() => handleKick("made")}
            >
              <Check className="w-4 h-4 mr-1" />
              Convertido
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              size="sm"
              onClick={() => handleKick("missed")}
            >
              <X className="w-4 h-4 mr-1" />
              Perdido
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
