"use client";

import { useState } from "react";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useI18n } from "@/lib/i18n";
import { formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import type { DisciplinaryClock, MedicalClock } from "@/types";

type EditTarget =
  | { kind: "disciplinary"; clock: DisciplinaryClock }
  | { kind: "medical"; clock: MedicalClock };

export function TimerPanel() {
  const {
    disciplinaryClocks,
    medicalClocks,
    roster,
    editDisciplinaryClock,
    editMedicalClock,
  } = useMatchStore();
  const { clubs } = useAdminStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");
  const [busy, setBusy] = useState(false);

  const activeDisciplinary = disciplinaryClocks.filter(
    (c) => c.status === "active"
  );
  const activeMedical = medicalClocks.filter((c) => c.status === "active");

  const getPlayer = (rosterId: string) =>
    roster.find((r) => r.id === rosterId);
  const getClub = (clubId: string) => clubs.find((c) => c.id === clubId);

  const openEdit = (target: EditTarget) => {
    let remainingSec = 0;
    if (target.kind === "disciplinary") {
      remainingSec = target.clock.durationSeconds - target.clock.elapsedGameSeconds;
    } else {
      const elapsed =
        (Date.now() - new Date(target.clock.startedAt).getTime()) / 1000;
      remainingSec = Math.max(0, target.clock.durationSeconds - elapsed);
    }
    setEditMinutes(String(Math.floor(remainingSec / 60)));
    setEditSeconds(String(Math.floor(remainingSec % 60)));
    setEditing(target);
  };

  const handleSave = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const mins = Math.max(0, parseInt(editMinutes) || 0);
      const secs = Math.max(0, Math.min(59, parseInt(editSeconds) || 0));
      const totalSeconds = mins * 60 + secs;

      if (editing.kind === "disciplinary") {
        await editDisciplinaryClock(editing.clock.id, totalSeconds);
      } else {
        await editMedicalClock(editing.clock.id, totalSeconds);
      }
      toast.success(t("clock.adjust_time"));
      setEditing(null);
    } finally {
      setBusy(false);
    }
  };

  if (activeDisciplinary.length === 0 && activeMedical.length === 0) {
    return null;
  }

  return (
    <>
      <div className="p-3 border-b border-[var(--border)] space-y-2 animate-fade-in-up">
        {/* Disciplinary Clocks */}
        {activeDisciplinary.length > 0 && (
          <div>
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
                      className={`w-3.5 h-5 rounded-sm shadow-sm shrink-0 ${isYellow ? "bg-[var(--rugby-yellow-card)]" : "bg-[var(--rugby-red-card)]"}`}
                    />
                    <span className="text-xs font-bold text-[var(--foreground)] w-6 shrink-0">
                      #{player?.shirtNumber ?? "?"}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] truncate flex-1">
                      {player?.playerName} ({club?.acronym})
                    </span>
                    <div className="w-16 h-2 bg-[var(--muted)] rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isYellow ? "bg-[var(--rugby-yellow-card)]" : "bg-[var(--rugby-red-card)]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold w-12 text-right tabular-nums text-[var(--foreground)] shrink-0">
                      {formatTime(remaining)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title={t("clock.adjust_time")}
                      onClick={() => openEdit({ kind: "disciplinary", clock })}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Medical Clocks */}
        {activeMedical.length > 0 && (
          <div>
            <div className="space-y-1">
              {activeMedical.map((clock) => {
                const player = getPlayer(clock.rosterId);
                const club = getClub(clock.clubId);
                const elapsed =
                  (Date.now() - new Date(clock.startedAt).getTime()) / 1000;
                const remaining = Math.max(0, clock.durationSeconds - elapsed);
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
                    <span className="text-xs font-bold text-[var(--foreground)] w-6 shrink-0">
                      #{player?.shirtNumber ?? "?"}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] truncate flex-1">
                      {player?.playerName} ({club?.acronym})
                    </span>
                    <div className="w-16 h-2 bg-[var(--muted)] rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold w-12 text-right tabular-nums text-[var(--foreground)] shrink-0">
                      {formatTime(remaining)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title={t("clock.adjust_time")}
                      onClick={() => openEdit({ kind: "medical", clock })}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Clock Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t("clock.adjust_time")}
            </DialogTitle>
            <DialogDescription>
              {editing?.kind === "disciplinary"
                ? (editing.clock.clockType === "yellow" ? t("timer.adjust_disc") : t("timer.adjust_disc_red"))
                : t("timer.adjust_medical")}
              {(() => {
                const player = editing ? getPlayer(editing.clock.rosterId) : null;
                return player ? ` — #${player.shirtNumber} ${player.playerName}` : "";
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t("timer.minutes_remaining")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("timer.seconds_remaining")}</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(e.target.value)}
                />
              </div>
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {editing?.kind === "disciplinary" ? t("clock.game_time_note") : t("clock.real_time_note")}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                {t("ui.cancel")}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={busy}>
                {busy ? t("ui.saving") : t("ui.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
