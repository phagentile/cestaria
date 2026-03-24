"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatTime } from "@/lib/format";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Square,
  RotateCcw,
  CheckCircle,
  Pencil,
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

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  confirmed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  live: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 animate-pulse",
  finished: "bg-red-500/20 text-red-300 border-red-500/30",
  reopened: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  live: "Ao Vivo",
  finished: "Encerrada",
  reopened: "Reaberta",
};

export function MatchHeader() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    match,
    startClock,
    pauseClock,
    nextPeriod,
    closeMatch,
    reopenMatch,
    confirmMatch,
    setClockSeconds,
    gameConfig,
  } = useMatchStore();
  const { clubs } = useAdminStore();
  const { t } = useI18n();

  const [showReset, setShowReset] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showReopen, setShowReopen] = useState(false);
  const [showClockEdit, setShowClockEdit] = useState(false);
  const [editMin, setEditMin] = useState("");
  const [editSec, setEditSec] = useState("");

  if (!match) return null;

  const home = clubs.find((c) => c.id === match.homeClubId);
  const away = clubs.find((c) => c.id === match.awayClubId);
  const isLocked = match.status === "finished";

  const handleResetClock = () => {
    if (!gameConfig) return;
    const period = match.period;
    let resetTo = 0;
    if (period === "second_half") resetTo = gameConfig.halfDuration * 60;
    else if (period === "extra_time_2")
      resetTo = gameConfig.extraTimeDuration * 60;
    setClockSeconds(resetTo);
    setShowReset(false);
    toast.info("Relogio resetado");
  };

  const handleConfirm = async () => {
    if (user) {
      await confirmMatch(user.id);
      toast.success("Partida confirmada");
    }
  };

  const handleClockEdit = () => {
    const mins = parseInt(editMin, 10);
    const secs = parseInt(editSec, 10);
    if (isNaN(mins) || isNaN(secs)) return;
    setClockSeconds(Math.max(0, mins * 60 + secs));
    setShowClockEdit(false);
    toast.info(t("clock.edit"));
  };

  return (
    <header
      className="text-white px-3 py-2"
      style={{
        background: "linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: back + teams + status */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm truncate">
            <span className="font-semibold">{home?.acronym ?? "CASA"}</span>
            <span className="text-gray-400 mx-2">vs</span>
            <span className="font-semibold">{away?.acronym ?? "VISIT"}</span>
          </div>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${STATUS_STYLES[match.status] ?? ""}`}
          >
            {STATUS_LABELS[match.status] ?? match.status}
          </span>
        </div>

        {/* Center: Clock + Period */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {PERIOD_LABELS[match.period] ?? match.period}
          </span>
          <div className="flex items-center gap-1">
            <div className="font-mono text-2xl font-bold tabular-nums">
              {formatTime(match.clockSeconds)}
            </div>
            {!match.clockRunning && !isLocked && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
                title={t("clock.main_edit")}
                onClick={() => {
                  setEditMin(String(Math.floor(match.clockSeconds / 60)));
                  setEditSec(String(match.clockSeconds % 60));
                  setShowClockEdit(true);
                }}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
          </div>
          <div
            className={`w-2 h-2 rounded-full ${match.clockRunning ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
          />
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          <LocaleToggle />
          <ThemeToggle />

          {/* Confirm button for scheduled matches */}
          {match.status === "scheduled" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:bg-white/10"
              onClick={handleConfirm}
              title={t("status.confirmed")}
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}

          {!isLocked && (
            <>
              {match.clockRunning ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => {
                    pauseClock();
                    toast.info(t("clock.edit"));
                  }}
                >
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:bg-white/10"
                  onClick={() => {
                    startClock();
                    toast.success(t("clock.edit"));
                  }}
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => {
                  nextPeriod();
                  toast.info(t("period.full_time"));
                }}
                title={t("period.full_time")}
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:bg-white/10"
                title={t("header.reset_title")}
                onClick={() => setShowReset(true)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-white/10"
                title={t("header.close_title")}
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
              className="text-yellow-400 hover:bg-white/10"
              onClick={() => setShowReopen(true)}
            >
              {t("header.reopen_confirm")}
            </Button>
          )}
        </div>
      </div>

      {/* Reset Dialog */}
      <AlertDialog open={showReset} onOpenChange={setShowReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("header.reset_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("header.reset_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("ui.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetClock}>
              {t("header.reset_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Match Dialog */}
      <AlertDialog open={showClose} onOpenChange={setShowClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("header.close_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("header.close_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("ui.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (user) {
                  closeMatch(user.id);
                  toast.success(t("status.finished"));
                }
                setShowClose(false);
              }}
            >
              {t("header.close_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen Dialog */}
      <AlertDialog open={showReopen} onOpenChange={setShowReopen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("header.reopen_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("header.reopen_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("ui.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (user) {
                  reopenMatch(user.id);
                  toast.info(t("header.reopen_confirm"));
                }
                setShowReopen(false);
              }}
            >
              {t("header.reopen_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clock Edit Dialog */}
      <Dialog open={showClockEdit} onOpenChange={setShowClockEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clock.main_edit")}</DialogTitle>
            <DialogDescription>{t("clock.adjust_time")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-min">{t("clock.minutes")}</Label>
                <Input
                  id="edit-min"
                  type="number"
                  min={0}
                  value={editMin}
                  onChange={(e) => setEditMin(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-sec">{t("clock.seconds")}</Label>
                <Input
                  id="edit-sec"
                  type="number"
                  min={0}
                  max={59}
                  value={editSec}
                  onChange={(e) => setEditSec(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleClockEdit}>
              {t("ui.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
