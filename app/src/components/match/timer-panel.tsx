"use client";

import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { formatTime } from "@/lib/format";

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
    <div className="p-3 border-b border-[var(--border)] space-y-2 animate-fade-in-up">
      {/* Disciplinary Clocks */}
      {activeDisciplinary.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 uppercase tracking-wide">
            Relogios Disciplinares (tempo de jogo)
          </div>
          <div className="space-y-1">
            {activeDisciplinary.map((clock) => {
              const player = getPlayer(clock.rosterId);
              const club = getClub(clock.clubId);
              const remaining =
                clock.durationSeconds - clock.elapsedGameSeconds;
              const pct =
                (clock.elapsedGameSeconds / clock.durationSeconds) * 100;
              const isYellow = clock.clockType === "yellow";

              return (
                <div
                  key={clock.id}
                  className="flex items-center gap-2 bg-[var(--muted)]/50 rounded-lg px-3 py-2"
                >
                  <div
                    className={`w-3.5 h-5 rounded-sm shadow-sm ${isYellow ? "bg-[var(--rugby-yellow-card)]" : "bg-[var(--rugby-red-card)]"}`}
                  />
                  <span className="text-xs font-bold text-[var(--foreground)] w-6">
                    #{player?.shirtNumber ?? "?"}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] truncate flex-1">
                    {player?.playerName} ({club?.acronym})
                  </span>
                  <div className="w-20 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${isYellow ? "bg-[var(--rugby-yellow-card)]" : "bg-[var(--rugby-red-card)]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold w-14 text-right tabular-nums text-[var(--foreground)]">
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
          <div className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 uppercase tracking-wide">
            Relogios Medicos (tempo real)
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
                  className="flex items-center gap-2 bg-[var(--muted)]/50 rounded-lg px-3 py-2"
                >
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                    {typeLabel}
                  </span>
                  <span className="text-xs font-bold text-[var(--foreground)] w-6">
                    #{player?.shirtNumber ?? "?"}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] truncate flex-1">
                    {player?.playerName} ({club?.acronym})
                  </span>
                  <div className="w-20 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold w-14 text-right tabular-nums text-[var(--foreground)]">
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
