"use client";

import { useState, useCallback, useRef } from "react";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import type { EventType, CardType, SubstitutionType } from "@/types";
import { LAW9_REASONS, SUBSTITUTION_LABELS, EVENT_LABELS } from "@/types";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type ActionMode = "score" | "card" | "substitution" | null;

export function ActionPanel() {
  const { match, roster, addScore, addCard, addSubstitution } =
    useMatchStore();
  const { clubs } = useAdminStore();
  const { hasPermission, getManagedClubId } = useAuthStore();
  const { t } = useI18n();
  const [mode, setMode] = useState<ActionMode>(null);
  const [busy, setBusy] = useState(false);
  const lastActionRef = useRef<number>(0);

  // Score state
  const [scoreType, setScoreType] = useState<EventType | "">("");
  const [scoreClubId, setScoreClubId] = useState("");
  const [scoreRosterId, setScoreRosterId] = useState("");

  // Card state
  const [cardClubId, setCardClubId] = useState("");
  const [cardRosterId, setCardRosterId] = useState("");
  const [cardType, setCardType] = useState<CardType | "">("");
  const [cardReason, setCardReason] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [isSecondYellow, setIsSecondYellow] = useState(false);

  // Substitution state
  const [subClubId, setSubClubId] = useState("");
  const [subOutId, setSubOutId] = useState("");
  const [subInId, setSubInId] = useState("");
  const [subType, setSubType] = useState<SubstitutionType | "">("");

  if (!match) return null;

  const canEditScore = hasPermission("edit_score");
  const canManageCards = hasPermission("manage_cards");
  const canApproveReplacements = hasPermission("approve_replacements");
  const canRequestReplacements = hasPermission("request_replacements");
  const canDoSubstitution = canApproveReplacements || canRequestReplacements;

  // Team managers são restritos ao seu próprio time (resolvido dinamicamente pelo papel no jogo)
  const teamManagerClubId = getManagedClubId(match.homeClubId, match.awayClubId);

  // If no relevant permission, render nothing
  if (!canEditScore && !canManageCards && !canDoSubstitution) return null;

  const homeClub = clubs.find((c) => c.id === match.homeClubId);
  const awayClub = clubs.find((c) => c.id === match.awayClubId);

  const getActivePlayers = (clubId: string) =>
    roster.filter(
      (r) => r.clubId === clubId && r.active && r.role !== "staff"
    );
  const getReserves = (clubId: string) =>
    roster.filter(
      (r) => r.clubId === clubId && !r.active && r.role === "reserve"
    );
  const getAllRoster = (clubId: string) =>
    roster.filter((r) => r.clubId === clubId);

  // Debounce guard
  const guardAction = useCallback((): boolean => {
    const now = Date.now();
    if (now - lastActionRef.current < 500) {
      return false;
    }
    lastActionRef.current = now;
    return true;
  }, []);

  const handleScore = async (type: EventType) => {
    if (type === "penalty_try") {
      setScoreType(type);
      setScoreRosterId("");
      setMode("score");
      return;
    }
    setScoreType(type);
    setMode("score");
  };

  const confirmScore = async () => {
    if (!scoreType || !scoreClubId || busy) return;
    if (!guardAction()) return;
    setBusy(true);
    try {
      if (scoreType === "penalty_try") {
        await addScore(scoreType, scoreClubId);
      } else {
        await addScore(scoreType, scoreClubId, scoreRosterId || undefined);
      }
      const club = clubs.find((c) => c.id === scoreClubId);
      toast.success(`${EVENT_LABELS[scoreType]} registrado — ${club?.acronym ?? ""}`);
      resetState();
    } finally {
      setBusy(false);
    }
  };

  const confirmCard = async () => {
    if (!cardClubId || !cardRosterId || !cardType || !cardReason || busy) return;
    if (!guardAction()) return;
    setBusy(true);
    try {
      await addCard(
        cardClubId,
        cardRosterId,
        cardType,
        cardReason,
        cardDescription || undefined
      );
      const player = roster.find((r) => r.id === cardRosterId);
      const cardLabel =
        cardType === "yellow" ? "Amarelo" : cardType === "red" ? "Vermelho" : "Verm. Temp.";
      toast.success(`Cartao ${cardLabel} — #${player?.shirtNumber ?? "?"} ${player?.playerName ?? ""}`);
      resetState();
    } finally {
      setBusy(false);
    }
  };

  const confirmSub = async () => {
    if (!subClubId || !subOutId || !subInId || !subType || busy) return;
    if (!guardAction()) return;
    setBusy(true);
    try {
      await addSubstitution(subClubId, subOutId, subInId, subType);
      const outPlayer = roster.find((r) => r.id === subOutId);
      const inPlayer = roster.find((r) => r.id === subInId);
      toast.success(
        `Substituicao: #${outPlayer?.shirtNumber ?? "?"} sai, #${inPlayer?.shirtNumber ?? "?"} entra`
      );
      resetState();
    } finally {
      setBusy(false);
    }
  };

  const resetState = () => {
    setMode(null);
    setScoreType("");
    setScoreClubId("");
    setScoreRosterId("");
    setCardClubId("");
    setCardRosterId("");
    setCardType("");
    setCardReason("");
    setCardDescription("");
    setIsSecondYellow(false);
    setSubClubId("");
    setSubOutId("");
    setSubInId("");
    setSubType("");
  };

  const scoreButtons: { type: EventType; label: string; color: string }[] = [
    { type: "try", label: "Try", color: "bg-[var(--rugby-try)] hover:bg-[var(--rugby-try)]/80" },
    { type: "conversion_made", label: "Conv.", color: "bg-[var(--rugby-conversion)] hover:bg-[var(--rugby-conversion)]/80" },
    { type: "conversion_missed", label: "Conv. X", color: "bg-[var(--rugby-conversion)]/60 hover:bg-[var(--rugby-conversion)]/50" },
    { type: "penalty_kick_made", label: "Penal", color: "bg-[var(--rugby-penalty)] hover:bg-[var(--rugby-penalty)]/80" },
    { type: "penalty_kick_missed", label: "Penal X", color: "bg-[var(--rugby-penalty)]/60 hover:bg-[var(--rugby-penalty)]/50" },
    { type: "drop_goal_made", label: "Drop", color: "bg-[var(--rugby-drop)] hover:bg-[var(--rugby-drop)]/80" },
    { type: "drop_goal_missed", label: "Drop X", color: "bg-[var(--rugby-drop)]/60 hover:bg-[var(--rugby-drop)]/50" },
    { type: "penalty_try", label: "P. Try", color: "bg-[var(--rugby-red-card)] hover:bg-[var(--rugby-red-card)]/80" },
  ];

  return (
    <div className="p-3 border-b border-[var(--border)] space-y-3 animate-fade-in-up">
      {/* Score Buttons — only for roles with edit_score */}
      {canEditScore && (
        <div>
          <div className="text-xs font-semibold text-[var(--muted-foreground)] mb-1.5 uppercase tracking-wide">
            Pontuacao
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {scoreButtons.map((btn) => (
              <Button
                key={btn.type}
                size="sm"
                className={`${btn.color} text-white text-xs h-9 font-semibold transition-all duration-200 active:scale-95`}
                onClick={() => handleScore(btn.type)}
                disabled={busy}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Card + Sub Buttons */}
      <div className="flex gap-2 flex-wrap">
        {canManageCards && (
          <>
            <Button
              size="sm"
              className="flex-1 h-9 bg-[var(--rugby-yellow-card)] text-black font-semibold hover:bg-[var(--rugby-yellow-card)]/80 transition-all duration-200 active:scale-95"
              onClick={() => {
                setCardType("yellow");
                setIsSecondYellow(false);
                setMode("card");
              }}
              disabled={busy}
            >
              Amarelo
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9 bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all duration-200 active:scale-95"
              onClick={() => {
                setCardType("yellow");
                setIsSecondYellow(true);
                setMode("card");
              }}
              disabled={busy}
              title="2º Amarelo → Expulsão (2YC)"
            >
              2YC
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9 bg-[var(--rugby-red-card)] text-white font-semibold hover:bg-[var(--rugby-red-card)]/80 transition-all duration-200 active:scale-95"
              onClick={() => {
                setCardType("red");
                setIsSecondYellow(false);
                setMode("card");
              }}
              disabled={busy}
            >
              Vermelho
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9 bg-[var(--rugby-red-card)]/60 text-white font-semibold hover:bg-[var(--rugby-red-card)]/50 transition-all duration-200 active:scale-95"
              onClick={() => {
                setCardType("temp_red");
                setIsSecondYellow(false);
                setMode("card");
              }}
              disabled={busy}
            >
              V. Temp.
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 active:scale-95"
              onClick={() => {
                if (teamManagerClubId) setSubClubId(teamManagerClubId);
                setSubType("front_row");
                setMode("substitution");
              }}
              disabled={busy}
              title="Substituição de linha de frente após cartão amarelo (YCS)"
            >
              YCS
            </Button>
          </>
        )}
        {canDoSubstitution && (
          <Button
            size="sm"
            className="flex-1 h-9 bg-[var(--rugby-substitution)] text-white font-semibold hover:bg-[var(--rugby-substitution)]/80 transition-all duration-200 active:scale-95"
            onClick={() => {
              if (teamManagerClubId) setSubClubId(teamManagerClubId);
              setMode("substitution");
            }}
            disabled={busy}
          >
            {canApproveReplacements ? "Subst." : "Solicitar Subst."}
          </Button>
        )}
      </div>

      {/* Score Dialog */}
      <Dialog open={mode === "score"} onOpenChange={() => resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrar {scoreType ? EVENT_LABELS[scoreType] : "Pontuacao"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Time *</Label>
              <Select
                value={scoreClubId}
                onValueChange={(v) => setScoreClubId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
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

            {scoreType !== "penalty_try" && scoreClubId && (
              <div className="space-y-1">
                <Label>Jogador</Label>
                <Select
                  value={scoreRosterId}
                  onValueChange={(v) => setScoreRosterId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    {getActivePlayers(scoreClubId).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        #{r.shirtNumber} {r.playerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              onClick={confirmScore}
              disabled={!scoreClubId || busy}
            >
              {busy ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Dialog */}
      <Dialog open={mode === "card"} onOpenChange={() => resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrar{" "}
              {isSecondYellow
                ? "2º Amarelo (Expulsão)"
                : cardType === "yellow"
                  ? "Cartão Amarelo"
                  : cardType === "red"
                    ? "Cartão Vermelho"
                    : "Vermelho Temp."}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Time *</Label>
              <Select
                value={cardClubId}
                onValueChange={(v) => setCardClubId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
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

            {cardClubId && (
              <div className="space-y-1">
                <Label>Atleta / Staff *</Label>
                <Select
                  value={cardRosterId}
                  onValueChange={(v) => setCardRosterId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllRoster(cardClubId).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        #{r.shirtNumber} {r.playerName}{" "}
                        {r.role === "staff" ? `(${r.staffRole})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label>Motivo (Lei 9) *</Label>
              <Select
                value={cardReason}
                onValueChange={(v) => setCardReason(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
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
              <Label>Descricao breve</Label>
              <Input
                value={cardDescription}
                onChange={(e) => setCardDescription(e.target.value)}
                placeholder="Detalhes da infracao"
              />
            </div>

            <Button
              className="w-full"
              onClick={confirmCard}
              disabled={
                !cardClubId || !cardRosterId || !cardReason || busy
              }
            >
              {busy ? "Registrando..." : "Registrar Cartao"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Substitution Dialog */}
      <Dialog
        open={mode === "substitution"}
        onOpenChange={() => resetState()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {canApproveReplacements ? "Registrar Substituicao" : "Solicitar Substituicao"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Time *</Label>
              {teamManagerClubId ? (
                /* Team managers see only their own team — no select needed */
                <div className="px-3 py-2 rounded-md border border-[var(--border)] text-sm bg-[var(--muted)]/30">
                  {teamManagerClubId === match.homeClubId
                    ? (homeClub?.name ?? t("match.home_short"))
                    : (awayClub?.name ?? t("match.away_short"))}
                </div>
              ) : (
                <Select
                  value={subClubId}
                  onValueChange={(v) => setSubClubId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o time" />
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
              )}
            </div>

            {subClubId && (
              <>
                <div className="space-y-1">
                  <Label>Quem sai *</Label>
                  <Select
                    value={subOutId}
                    onValueChange={(v) => setSubOutId(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {getActivePlayers(subClubId).map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          #{r.shirtNumber} {r.playerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Quem entra *</Label>
                  <Select
                    value={subInId}
                    onValueChange={(v) => setSubInId(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {getReserves(subClubId).map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          #{r.shirtNumber} {r.playerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Select
                value={subType}
                onValueChange={(v) =>
                  setSubType(v as SubstitutionType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("action.sub_type_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(SUBSTITUTION_LABELS) as [
                      SubstitutionType,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={confirmSub}
              disabled={
                !subClubId || !subOutId || !subInId || !subType || busy
              }
            >
              {busy ? "Registrando..." : "Registrar Substituicao"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
