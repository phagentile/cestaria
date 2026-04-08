"use client";

import { useState } from "react";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
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
import { LAW9_REASONS, SUBSTITUTION_LABELS } from "@/types";
import { toast } from "sonner";

type ActionMode = "score" | "card" | "substitution" | null;

export function ActionPanel() {
  const { match, roster, addScore, addCard, addSubstitution } =
    useMatchStore();
  const { clubs } = useAdminStore();
  const [mode, setMode] = useState<ActionMode>(null);

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

  // Substitution state
  const [subClubId, setSubClubId] = useState("");
  const [subOutId, setSubOutId] = useState("");
  const [subInId, setSubInId] = useState("");
  const [subType, setSubType] = useState<SubstitutionType | "">("");

  if (!match) return null;

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

  const handleScore = async (type: EventType) => {
    if (type === "penalty_try") {
      // Penalty try: no player selection, select team
      setScoreType(type);
      setScoreRosterId("");
      setMode("score");
      return;
    }
    setScoreType(type);
    setMode("score");
  };

  const confirmScore = async () => {
    if (!scoreType || !scoreClubId) return;
    if (scoreType === "penalty_try") {
      await addScore(scoreType, scoreClubId);
      toast.success("Penal Try registrado");
    } else {
      await addScore(
        scoreType,
        scoreClubId,
        scoreRosterId || undefined
      );
      toast.success("Pontuacao registrada");
    }
    resetState();
  };

  const confirmCard = async () => {
    if (!cardClubId || !cardRosterId || !cardType || !cardReason) return;
    await addCard(
      cardClubId,
      cardRosterId,
      cardType,
      cardReason,
      cardDescription || undefined
    );
    toast.success("Cartao registrado");
    resetState();
  };

  const confirmSub = async () => {
    if (!subClubId || !subOutId || !subInId || !subType) return;
    await addSubstitution(subClubId, subOutId, subInId, subType);
    toast.success("Substituicao registrada");
    resetState();
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
    setSubClubId("");
    setSubOutId("");
    setSubInId("");
    setSubType("");
  };

  const scoreButtons: { type: EventType; label: string; color: string }[] = [
    { type: "try", label: "Try", color: "bg-green-600 hover:bg-green-700" },
    {
      type: "conversion_made",
      label: "Conv.",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      type: "conversion_missed",
      label: "Conv. X",
      color: "bg-blue-400 hover:bg-blue-500",
    },
    {
      type: "penalty_kick_made",
      label: "Penal",
      color: "bg-orange-600 hover:bg-orange-700",
    },
    {
      type: "penalty_kick_missed",
      label: "Penal X",
      color: "bg-orange-400 hover:bg-orange-500",
    },
    {
      type: "drop_goal_made",
      label: "Drop",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      type: "drop_goal_missed",
      label: "Drop X",
      color: "bg-purple-400 hover:bg-purple-500",
    },
    {
      type: "penalty_try",
      label: "Penal Try",
      color: "bg-red-600 hover:bg-red-700",
    },
  ];

  return (
    <div className="p-3 border-b space-y-3">
      {/* Score Buttons */}
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1.5">
          PONTUACAO
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {scoreButtons.map((btn) => (
            <Button
              key={btn.type}
              size="sm"
              className={`${btn.color} text-white text-xs h-8`}
              onClick={() => handleScore(btn.type)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Card + Sub Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
          onClick={() => {
            setCardType("yellow");
            setMode("card");
          }}
        >
          Amarelo
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
          onClick={() => {
            setCardType("red");
            setMode("card");
          }}
        >
          Vermelho
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-red-300 text-red-400 hover:bg-red-50"
          onClick={() => {
            setCardType("temp_red");
            setMode("card");
          }}
        >
          Verm. Temp.
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => setMode("substitution")}
        >
          Subst.
        </Button>
      </div>

      {/* Score Dialog */}
      <Dialog open={mode === "score"} onOpenChange={() => resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pontuacao</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Time *</Label>
              <Select value={scoreClubId} onValueChange={(v) => setScoreClubId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match.homeClubId}>
                    {homeClub?.name ?? "Casa"}
                  </SelectItem>
                  <SelectItem value={match.awayClubId}>
                    {awayClub?.name ?? "Visitante"}
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
              disabled={!scoreClubId}
            >
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Dialog */}
      <Dialog open={mode === "card"} onOpenChange={() => resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrar Cartao{" "}
              {cardType === "yellow"
                ? "Amarelo"
                : cardType === "red"
                  ? "Vermelho"
                  : "Vermelho Temp."}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Time *</Label>
              <Select value={cardClubId} onValueChange={(v) => setCardClubId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match.homeClubId}>
                    {homeClub?.name ?? "Casa"}
                  </SelectItem>
                  <SelectItem value={match.awayClubId}>
                    {awayClub?.name ?? "Visitante"}
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
              <Select value={cardReason} onValueChange={(v) => setCardReason(v ?? "")}>
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
              disabled={!cardClubId || !cardRosterId || !cardReason}
            >
              Registrar Cartao
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
            <DialogTitle>Registrar Substituicao</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Time *</Label>
              <Select value={subClubId} onValueChange={(v) => setSubClubId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match.homeClubId}>
                    {homeClub?.name ?? "Casa"}
                  </SelectItem>
                  <SelectItem value={match.awayClubId}>
                    {awayClub?.name ?? "Visitante"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {subClubId && (
              <>
                <div className="space-y-1">
                  <Label>Quem sai *</Label>
                  <Select value={subOutId} onValueChange={(v) => setSubOutId(v ?? "")}>
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
                  <Select value={subInId} onValueChange={(v) => setSubInId(v ?? "")}>
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
                  <SelectValue placeholder="Tipo de substituicao" />
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
              disabled={!subClubId || !subOutId || !subInId || !subType}
            >
              Registrar Substituicao
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
