"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatTime } from "@/lib/format";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Square,
  RotateCcw,
} from "lucide-react";

const PERIOD_LABELS: Record<string, string> = {
  not_started: "Nao Iniciada",
  first_half: "1o Tempo",
  half_time: "Intervalo",
  second_half: "2o Tempo",
  full_time: "Tempo Regulamentar",
  extra_time_1: "Prorrogacao 1",
  extra_time_break: "Intervalo Prorr.",
  extra_time_2: "Prorrogacao 2",
  penalties: "Penais",
  finished: "Encerrada",
};

export function MatchHeader() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { match, startClock, pauseClock, nextPeriod, closeMatch, reopenMatch, setClockSeconds, gameConfig } =
    useMatchStore();
  const { clubs } = useAdminStore();

  const [showReset, setShowReset] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showReopen, setShowReopen] = useState(false);

  if (!match) return null;

  const home = clubs.find((c) => c.id === match.homeClubId);
  const away = clubs.find((c) => c.id === match.awayClubId);
  const isLocked = match.status === "finished";

  const handleResetClock = () => {
    if (!gameConfig) return;
    const period = match.period;
    let resetTo = 0;
    if (period === "second_half") resetTo = gameConfig.halfDuration * 60;
    else if (period === "extra_time_2") resetTo = gameConfig.extraTimeDuration * 60;
    setClockSeconds(resetTo);
    setShowReset(false);
  };

  return (
    <header className="bg-zinc-900 text-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        {/* Left: back + teams */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-zinc-800"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm truncate">
            <span className="font-semibold">{home?.acronym ?? "CASA"}</span>
            <span className="text-zinc-400 mx-2">vs</span>
            <span className="font-semibold">{away?.acronym ?? "VISIT"}</span>
          </div>
        </div>

        {/* Center: Clock + Period */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-white border-zinc-600 text-xs"
          >
            {PERIOD_LABELS[match.period] ?? match.period}
          </Badge>
          <div className="font-mono text-2xl font-bold tabular-nums">
            {formatTime(match.clockSeconds)}
          </div>
          <div
            className={`w-2 h-2 rounded-full ${match.clockRunning ? "bg-green-500 animate-pulse" : "bg-zinc-500"}`}
          />
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {!isLocked && (
            <>
              {match.clockRunning ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-zinc-800"
                  onClick={pauseClock}
                >
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:bg-zinc-800"
                  onClick={startClock}
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-zinc-800"
                onClick={nextPeriod}
                title="Proximo periodo"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:bg-zinc-800"
                title="Reset relogio"
                onClick={() => setShowReset(true)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-zinc-800"
                title="Encerrar partida"
                onClick={() => setShowClose(true)}
              >
                <Square className="w-4 h-4" />
              </Button>
            </>
          )}

          {isLocked && (
            <Button
              variant="ghost"
              size="sm"
              className="text-yellow-400 hover:bg-zinc-800"
              onClick={() => setShowReopen(true)}
            >
              Reabrir
            </Button>
          )}
        </div>
      </div>

      {/* Reset Dialog */}
      <AlertDialog open={showReset} onOpenChange={setShowReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar relogio?</AlertDialogTitle>
            <AlertDialogDescription>
              O relogio sera resetado para o inicio do periodo atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetClock}>
              Confirmar Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Match Dialog */}
      <AlertDialog open={showClose} onOpenChange={setShowClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar partida?</AlertDialogTitle>
            <AlertDialogDescription>
              A partida sera encerrada e todas as alteracoes serao bloqueadas.
              Voce podera reabrir depois se necessario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (user) closeMatch(user.id);
                setShowClose(false);
              }}
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen Dialog */}
      <AlertDialog open={showReopen} onOpenChange={setShowReopen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir partida?</AlertDialogTitle>
            <AlertDialogDescription>
              A partida sera reaberta para edicao. Esta acao sera registrada no
              log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (user) reopenMatch(user.id);
                setShowReopen(false);
              }}
            >
              Reabrir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
