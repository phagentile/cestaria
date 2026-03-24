"use client";

/**
 * EventEditDialog
 *
 * Popup de edição completa de um evento da timeline.
 * Campos exibidos dependem do tipo do evento:
 *
 *  • Pontuação (try, conversion, penalty, drop, penalty_try)
 *      - Tempo (minuto + segundo)
 *      - Time (clubId)
 *      - Jogador (rosterId) — exceto penalty_try
 *
 *  • Cartão (yellow_card, red_card, temp_red_card)
 *      - Tempo
 *      - Time + Atleta/Staff
 *      - Motivo (Lei 9)
 *      - Descrição breve
 *
 *  • Substituição (substitution_out, substitution_in)
 *      - Tempo
 *      - Time + Atleta
 *      - Tipo de substituição
 *
 *  • Retorno / Médico (card_return, medical_return, blood_time_end)
 *      - Apenas Tempo  (não há campos de negócio a alterar)
 *
 *  • Outros (period_start, period_end, blood_time_start, hia_start, hia_end)
 *      - Apenas Tempo
 */

import { useState, useEffect } from "react";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useI18n } from "@/lib/i18n";
import type { MatchEvent } from "@/types";
import {
  EVENT_LABELS,
  LAW9_REASONS,
  SUBSTITUTION_LABELS,
} from "@/types";
import type { SubstitutionType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock } from "lucide-react";

interface Props {
  event: MatchEvent | null;
  onClose: () => void;
}

// Grupos de tipos para determinar quais campos mostrar
const SCORE_TYPES = new Set([
  "try",
  "conversion_made",
  "conversion_missed",
  "penalty_kick_made",
  "penalty_kick_missed",
  "drop_goal_made",
  "drop_goal_missed",
  "penalty_try",
]);

const CARD_TYPES = new Set(["yellow_card", "red_card", "temp_red_card"]);
const SUB_TYPES = new Set(["substitution_out", "substitution_in"]);

export function EventEditDialog({ event, onClose }: Props) {
  const { match, roster, editEvent } = useMatchStore();
  const { clubs } = useAdminStore();
  const { t } = useI18n();

  // ── Tempo ──────────────────────────────────────────────────
  const [minute, setMinute] = useState("");
  const [second, setSecond] = useState("");

  // ── Time / Jogador ────────────────────────────────────────
  const [clubId, setClubId] = useState("");
  const [rosterId, setRosterId] = useState("");

  // ── Cartão ────────────────────────────────────────────────
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  // ── Substituição ─────────────────────────────────────────
  const [subType, setSubType] = useState<SubstitutionType | "">("");

  const [busy, setBusy] = useState(false);

  // Sincroniza estado com o evento ao abrir
  useEffect(() => {
    if (!event) return;
    setMinute(String(event.minute));
    setSecond(String(event.second));
    setClubId(event.clubId ?? "");
    setRosterId(event.rosterId ?? "");
    const meta = event.metadata as Record<string, string> | undefined;
    setReason(meta?.reason ?? "");
    setDescription(meta?.description ?? "");
    setSubType((meta?.substitutionType as SubstitutionType) ?? "");
  }, [event]);

  if (!event || !match) return null;

  const homeClub = clubs.find((c) => c.id === match.homeClubId);
  const awayClub = clubs.find((c) => c.id === match.awayClubId);

  const isScore = SCORE_TYPES.has(event.eventType);
  const isCard = CARD_TYPES.has(event.eventType);
  const isSub = SUB_TYPES.has(event.eventType);
  const isPenaltyTry = event.eventType === "penalty_try";

  // Jogadores disponíveis por time (para score e cartão)
  const allRosterForClub = (cId: string) =>
    roster.filter((r) => r.clubId === cId);
  const activeForClub = (cId: string) =>
    roster.filter((r) => r.clubId === cId && r.active && r.role !== "staff");

  const handleSave = async () => {
    setBusy(true);
    try {
      const updates: Partial<MatchEvent> = {
        minute: Math.max(0, parseInt(minute) || 0),
        second: Math.max(0, Math.min(59, parseInt(second) || 0)),
      };

      if ((isScore || isCard || isSub) && clubId) {
        updates.clubId = clubId;
      }
      if ((isScore || isCard || isSub) && !isPenaltyTry) {
        updates.rosterId = rosterId || undefined;
      }

      // Atualiza metadata mantendo campos existentes
      if (isCard) {
        updates.metadata = {
          ...(event.metadata as Record<string, unknown>),
          reason,
          description,
        };
      }
      if (isSub && subType) {
        updates.metadata = {
          ...(event.metadata as Record<string, unknown>),
          substitutionType: subType,
        };
      }

      await editEvent(event.id, updates);
      toast.success(t("event_edit.save"));
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{EVENT_LABELS[event.eventType]}</span>
          </DialogTitle>
          <DialogDescription>
            {t("event_edit.changes_note")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* ── Tempo ── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {t("event_edit.time")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t("event_edit.minute")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("event_edit.second")}</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={second}
                  onChange={(e) => setSecond(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Time ── (score, cartão, substituição) */}
          {(isScore || isCard || isSub) && (
            <div className="space-y-1">
              <Label>{t("event_edit.team")} *</Label>
              <Select value={clubId} onValueChange={(v) => { setClubId(v ?? ""); setRosterId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ui.search")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match.homeClubId}>
                    {homeClub?.name ?? t("match.home_short")}
                  </SelectItem>
                  <SelectItem value={match.awayClubId}>
                    {awayClub?.name ?? t("match.away_short")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Jogador ── (score sem penalty_try, cartão, substituição) */}
          {(isScore && !isPenaltyTry && clubId) && (
            <div className="space-y-1">
              <Label>{t("event_edit.player")}</Label>
              <Select value={rosterId} onValueChange={(v) => setRosterId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ui.search")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("event_edit.no_player")}</SelectItem>
                  {activeForClub(clubId).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      #{r.shirtNumber} {r.playerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(isCard && clubId) && (
            <div className="space-y-1">
              <Label>{t("event_edit.athlete_staff")} *</Label>
              <Select value={rosterId} onValueChange={(v) => setRosterId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ui.search")} />
                </SelectTrigger>
                <SelectContent>
                  {allRosterForClub(clubId).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      #{r.shirtNumber} {r.playerName}
                      {r.role === "staff" ? ` (${r.staffRole})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(isSub && clubId) && (
            <div className="space-y-1">
              <Label>{t("event_edit.athlete")} *</Label>
              <Select value={rosterId} onValueChange={(v) => setRosterId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ui.search")} />
                </SelectTrigger>
                <SelectContent>
                  {allRosterForClub(clubId).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      #{r.shirtNumber} {r.playerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Campos de Cartão ── */}
          {isCard && (
            <>
              <div className="space-y-1">
                <Label>{t("event_edit.law9_reason")} *</Label>
                <Select value={reason} onValueChange={(v) => setReason(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("ui.search")} />
                  </SelectTrigger>
                  <SelectContent>
                    {LAW9_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("event_edit.description")}</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("event_edit.infraction_detail")}
                />
              </div>
            </>
          )}

          {/* ── Tipo de Substituição ── */}
          {isSub && (
            <div className="space-y-1">
              <Label>{t("event_edit.sub_type")} *</Label>
              <Select
                value={subType}
                onValueChange={(v) => setSubType(v as SubstitutionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("ui.search")} />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SUBSTITUTION_LABELS) as [SubstitutionType, string][]).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Aviso para tipos somente-tempo ── */}
          {!isScore && !isCard && !isSub && (
            <p className="text-xs text-[var(--muted-foreground)] italic">
              {t("event_edit.time_only")}
            </p>
          )}

          {/* ── Ações ── */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
              {t("ui.cancel")}
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={busy}>
              {busy ? t("ui.saving") : t("event_edit.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
