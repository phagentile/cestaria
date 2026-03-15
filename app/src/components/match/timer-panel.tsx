"use client";

import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function TimerPanel() {
  const { disciplinaryClocks, medicalClocks, roster } = useMatchStore();
  const { clubs } = useAdminStore();

  const activeDisciplinary = disciplinaryClocks.filter(
    (c) => c.status === "active"
  );
  const activeMedical = medicalClocks.filter((c) => c.status === "active");

  if (activeDisciplinary.length === 0 && activeMedical.length === 0) {
    return null;
  }

  const getPlayer = (rosterId: string) =>
    roster.find((r) => r.id === rosterId);
  const getClub = (clubId: string) => clubs.find((c) => c.id === clubId);

  return (
    <div className="p-3 border-b space-y-2">
      {/* Disciplinary Clocks */}
      {activeDisciplinary.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            RELOGIOS DISCIPLINARES (tempo de jogo)
          </div>
          <div className="space-y-1">
            {activeDisciplinary.map((clock) => {
              const player = getPlayer(clock.rosterId);
              const club = getClub(clock.clubId);
              const remaining =
                clock.durationSeconds - clock.elapsedGameSeconds;
              const pct =
                (clock.elapsedGameSeconds / clock.durationSeconds) * 100;

              return (
                <div
                  key={clock.id}
                  className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1.5"
                >
                  <div
                    className={`w-3 h-4 rounded-sm ${clock.clockType === "yellow" ? "bg-yellow-400" : "bg-red-500"}`}
                  />
                  <span className="text-xs font-medium">
                    #{player?.shirtNumber ?? "?"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {player?.playerName} ({club?.acronym})
                  </span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${clock.clockType === "yellow" ? "bg-yellow-400" : "bg-red-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold w-12 text-right tabular-nums">
                    {formatTime(remaining)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Medical Clocks */}
      {activeMedical.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            RELOGIOS MEDICOS (tempo real)
          </div>
          <div className="space-y-1">
            {activeMedical.map((clock) => {
              const player = getPlayer(clock.rosterId);
              const club = getClub(clock.clubId);
              const elapsed =
                (Date.now() - new Date(clock.startedAt).getTime()) / 1000;
              const remaining = Math.max(
                0,
                clock.durationSeconds - elapsed
              );
              const pct = (elapsed / clock.durationSeconds) * 100;

              const typeLabel =
                clock.clockType === "blood"
                  ? "Sangue"
                  : clock.clockType === "hia"
                    ? "HIA"
                    : "Sangue+HIA";

              return (
                <div
                  key={clock.id}
                  className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1.5"
                >
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 h-4 border-cyan-500 text-cyan-600"
                  >
                    {typeLabel}
                  </Badge>
                  <span className="text-xs font-medium">
                    #{player?.shirtNumber ?? "?"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {player?.playerName} ({club?.acronym})
                  </span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold w-12 text-right tabular-nums">
                    {formatTime(remaining)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
