"use client";

/**
 * ClockResolutionPopups
 *
 * Exibe popups modais quando um relógio disciplinar ou médico expira,
 * pedindo ao operador que resolva o que acontece com o atleta.
 *
 * Fluxo disciplinar:
 *  - Amarelo expirado → popup informa retorno automático (apenas confirmar)
 *  - Vermelho Temporário expirado → popup pede quem vai substituir permanentemente
 *
 * Fluxo médico (Sangue / HIA):
 *  - Tempo esgotado → popup pergunta:
 *    a) Manter substituição por saúde (outPlayer fica fora)
 *    b) Atleta liberado retorna ao campo (selecionar substituto que sai)
 */

import { useState } from "react";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useI18n } from "@/lib/i18n";
import type { ClockPending } from "@/stores/match-store";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, UserCheck, UserX, Heart } from "lucide-react";

// ─── Individual popup: Cartão Disciplinar Expirado ─────────────────────────

function DisciplinaryExpiredPopup({
  pending,
}: {
  pending: ClockPending;
}) {
  const { roster, returnFromCard } = useMatchStore();
  const { clubs } = useAdminStore();
  const { t } = useI18n();
  const [inRosterId, setInRosterId] = useState("");
  const [busy, setBusy] = useState(false);

  const outPlayer = roster.find((r) => r.id === pending.rosterId);
  const club = clubs.find((c) => c.id === pending.clubId);
  const isYellow = pending.clockSubtype === "yellow";
  const isTempRed = pending.clockSubtype === "temp_red";

  // Reservas disponíveis do mesmo time
  const availableReserves = roster.filter(
    (r) =>
      r.clubId === pending.clubId &&
      !r.active &&
      r.role === "reserve"
  );

  const handleConfirm = async () => {
    if (isTempRed && !inRosterId && availableReserves.length > 0) {
      toast.error(t("popup.disciplinary.select_reserve"));
      return;
    }
    setBusy(true);
    try {
      await returnFromCard(pending.clockId, inRosterId || undefined);
      if (isYellow) {
        toast.success(
          `#${outPlayer?.shirtNumber} ${outPlayer?.playerName} retornou ao campo`
        );
      } else {
        if (inRosterId) {
          const inPlayer = roster.find((r) => r.id === inRosterId);
          toast.success(
            `Substituição: #${outPlayer?.shirtNumber} sai → #${inPlayer?.shirtNumber} entra (Vermelho Temp.)`
          );
        } else {
          toast.success(
            `#${outPlayer?.shirtNumber} ${outPlayer?.playerName} retornou ao campo`
          );
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          {isYellow ? (
            <div className="w-5 h-7 rounded-sm bg-[var(--rugby-yellow-card)] shadow" />
          ) : (
            <div className="w-5 h-7 rounded-sm bg-[var(--rugby-red-card)] shadow" />
          )}
          <DialogTitle>
            {isYellow ? t("popup.disciplinary.yellow_title") : t("popup.disciplinary.tempred_title")}
          </DialogTitle>
        </div>
        <DialogDescription>
          {isYellow ? t("popup.disciplinary.yellow_desc") : t("popup.disciplinary.tempred_desc")}{" "}
          <strong>#{outPlayer?.shirtNumber} {outPlayer?.playerName}</strong> ({club?.acronym}).
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-2">
        {isYellow && (
          <div className="flex items-start gap-3 bg-[var(--rugby-yellow-card)]/10 border border-[var(--rugby-yellow-card)]/30 rounded-lg p-3">
            <UserCheck className="w-5 h-5 text-[var(--rugby-yellow-card)] mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-[var(--foreground)]">{t("popup.disciplinary.confirm_return")}</p>
              <p className="text-[var(--muted-foreground)] mt-0.5">{t("popup.disciplinary.yellow_desc")}</p>
            </div>
          </div>
        )}

        {isTempRed && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-[var(--rugby-red-card)]/10 border border-[var(--rugby-red-card)]/30 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-[var(--rugby-red-card)] mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-[var(--foreground)]">{t("popup.disciplinary.confirm_sub")}</p>
                <p className="text-[var(--muted-foreground)] mt-0.5">{t("popup.disciplinary.tempred_desc")}</p>
              </div>
            </div>

            {availableReserves.length > 0 ? (
              <div className="space-y-1.5">
                <Label>{t("popup.disciplinary.select_reserve")} #{outPlayer?.shirtNumber}?</Label>
                <Select value={inRosterId} onValueChange={(v) => setInRosterId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("popup.disciplinary.select_reserve")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReserves.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        #{r.shirtNumber} {r.playerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[var(--muted)]/50 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)]">
                <UserX className="w-4 h-4 shrink-0" />
                {t("popup.disciplinary.yellow_desc")}
              </div>
            )}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={busy || (isTempRed && availableReserves.length > 0 && !inRosterId)}
        >
          {busy ? t("ui.saving") : isYellow ? t("popup.disciplinary.confirm_return") : inRosterId ? t("popup.disciplinary.confirm_sub") : t("popup.disciplinary.confirm_return")}
        </Button>
      </div>
    </DialogContent>
  );
}

// ─── Individual popup: Relógio Médico Expirado ────────────────────────────

function MedicalExpiredPopup({
  pending,
}: {
  pending: ClockPending;
}) {
  const { roster, resolveMedical } = useMatchStore();
  const { clubs } = useAdminStore();
  const { t } = useI18n();
  const [decision, setDecision] = useState<"return" | "keep" | null>(null);
  const [substitutoId, setSubstitutoId] = useState(""); // quem saiu temporariamente (que vai sair)
  const [busy, setBusy] = useState(false);

  const outPlayer = roster.find((r) => r.id === pending.rosterId);
  const club = clubs.find((c) => c.id === pending.clubId);

  const typeLabel =
    pending.clockSubtype === "blood"
      ? "Sangue"
      : pending.clockSubtype === "hia"
      ? "HIA"
      : "Sangue+HIA";

  // Atletas ativos do mesmo time (possíveis substitutos temporários que devem sair)
  const activePlayers = roster.filter(
    (r) =>
      r.clubId === pending.clubId &&
      r.active &&
      r.role !== "staff" &&
      r.id !== pending.rosterId
  );

  const handleConfirm = async () => {
    if (!decision) return;
    if (decision === "return" && activePlayers.length > 0 && !substitutoId) {
      toast.error(t("popup.medical.select_exits"));
      return;
    }
    setBusy(true);
    try {
      if (decision === "keep") {
        await resolveMedical(pending.clockId, true);
        toast.info(
          `Substituição mantida por saúde — #${outPlayer?.shirtNumber} ${outPlayer?.playerName} não volta`
        );
      } else {
        await resolveMedical(pending.clockId, false, substitutoId || undefined);
        toast.success(
          `#${outPlayer?.shirtNumber} ${outPlayer?.playerName} liberado e retornou ao campo`
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-cyan-400" />
          <DialogTitle>{t("popup.medical.title")} — {typeLabel}</DialogTitle>
        </div>
        <DialogDescription>
          <strong>#{outPlayer?.shirtNumber} {outPlayer?.playerName}</strong> ({club?.acronym})
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 pt-2">
        {/* Opção A: Manter substituição */}
        <button
          onClick={() => setDecision("keep")}
          className={`w-full text-left rounded-lg border p-3 transition-all duration-150 ${
            decision === "keep"
              ? "border-red-500 bg-red-500/10"
              : "border-[var(--border)] bg-[var(--muted)]/30 hover:bg-[var(--accent)]/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <UserX
              className={`w-5 h-5 mt-0.5 shrink-0 ${decision === "keep" ? "text-red-400" : "text-[var(--muted-foreground)]"}`}
            />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{t("popup.medical.keep_sub")}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{t("popup.medical.keep_sub_desc")}</p>
            </div>
          </div>
        </button>

        {/* Opção B: Atleta retorna */}
        <button
          onClick={() => setDecision("return")}
          className={`w-full text-left rounded-lg border p-3 transition-all duration-150 ${
            decision === "return"
              ? "border-[var(--rugby-try)] bg-[var(--rugby-try)]/10"
              : "border-[var(--border)] bg-[var(--muted)]/30 hover:bg-[var(--accent)]/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <UserCheck
              className={`w-5 h-5 mt-0.5 shrink-0 ${decision === "return" ? "text-[var(--rugby-try)]" : "text-[var(--muted-foreground)]"}`}
            />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{t("popup.medical.return_athlete")}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{t("popup.medical.return_athlete_desc")}</p>
            </div>
          </div>
        </button>

        {/* Se retornar: selecionar qual substituto sai */}
        {decision === "return" && activePlayers.length > 0 && (
          <div className="space-y-1.5 pl-1">
            <Label>{t("popup.medical.select_exits")}</Label>
            <Select value={substitutoId} onValueChange={(v) => setSubstitutoId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder={t("popup.medical.select_exits")} />
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
        )}

        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={
            busy ||
            !decision ||
            (decision === "return" && activePlayers.length > 0 && !substitutoId)
          }
        >
          {busy ? t("ui.saving") : t("ui.confirm")}
        </Button>
      </div>
    </DialogContent>
  );
}

// ─── Container: renderiza todos os popups pendentes ──────────────────────

export function ClockResolutionPopups() {
  const { clockPendings, dismissPending } = useMatchStore();

  if (clockPendings.length === 0) return null;

  // Processa um por vez (o mais antigo primeiro)
  const current = clockPendings[0];

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        // Não permite fechar sem resolver — exceto amarelo que pode ser descartado
        if (!open && current.clockSubtype === "yellow") {
          dismissPending(current.clockId);
        }
      }}
    >
      {current.type === "disciplinary_expired" && (
        <DisciplinaryExpiredPopup pending={current} />
      )}
      {current.type === "medical_expired" && (
        <MedicalExpiredPopup pending={current} />
      )}
    </Dialog>
  );
}
