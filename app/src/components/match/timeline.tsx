"use client";

import { useState } from "react";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { EVENT_LABELS } from "@/types";
import type { MatchEvent, EventType } from "@/types";
import { formatMinSec } from "@/lib/format";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pencil,
  Trash2,
  CircleDot,
  Check,
  X as XIcon,
  ArrowRightLeft,
  AlertTriangle,
  UserCheck,
  Heart,
} from "lucide-react";

// Circle color by event type
const EVENT_CIRCLE_COLOR: Partial<Record<EventType, string>> = {
  try: "bg-[var(--rugby-try)] text-white",
  conversion_made: "bg-[var(--rugby-conversion)] text-white",
  conversion_missed: "bg-red-500 text-white",
  penalty_kick_made: "bg-[var(--rugby-penalty)] text-white",
  penalty_kick_missed: "bg-red-500 text-white",
  drop_goal_made: "bg-[var(--rugby-drop)] text-white",
  drop_goal_missed: "bg-red-500 text-white",
  penalty_try: "bg-[var(--rugby-try)] text-white",
  yellow_card: "bg-[var(--rugby-yellow-card)] text-black",
  red_card: "bg-[var(--rugby-red-card)] text-white",
  temp_red_card: "bg-[var(--rugby-red-card)]/70 text-white",
  substitution_out: "bg-[var(--rugby-substitution)] text-white",
  substitution_in: "bg-[var(--rugby-substitution)] text-white",
  card_return: "bg-[var(--rugby-try)] text-white",
  medical_return: "bg-cyan-500 text-white",
};

const EVENT_LINE_COLOR: Partial<Record<EventType, string>> = {
  try: "border-[var(--rugby-try)]",
  conversion_made: "border-[var(--rugby-conversion)]",
  conversion_missed: "border-red-500",
  penalty_kick_made: "border-[var(--rugby-penalty)]",
  penalty_kick_missed: "border-red-500",
  drop_goal_made: "border-[var(--rugby-drop)]",
  drop_goal_missed: "border-red-500",
  penalty_try: "border-[var(--rugby-try)]",
  yellow_card: "border-[var(--rugby-yellow-card)]",
  red_card: "border-[var(--rugby-red-card)]",
  temp_red_card: "border-[var(--rugby-red-card)]/70",
  substitution_out: "border-[var(--rugby-substitution)]",
  substitution_in: "border-[var(--rugby-substitution)]",
  card_return: "border-[var(--rugby-try)]",
  medical_return: "border-cyan-500",
};

function EventIcon({ type }: { type: EventType }) {
  switch (type) {
    case "try":
    case "penalty_try":
      return <CircleDot className="w-3.5 h-3.5" />;
    case "conversion_made":
    case "penalty_kick_made":
    case "drop_goal_made":
      return <Check className="w-3.5 h-3.5" />;
    case "conversion_missed":
    case "penalty_kick_missed":
    case "drop_goal_missed":
      return <XIcon className="w-3.5 h-3.5" />;
    case "substitution_out":
    case "substitution_in":
      return <ArrowRightLeft className="w-3.5 h-3.5" />;
    case "yellow_card":
    case "red_card":
    case "temp_red_card":
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case "card_return":
      return <UserCheck className="w-3.5 h-3.5" />;
    case "medical_return":
      return <Heart className="w-3.5 h-3.5" />;
    default:
      return <CircleDot className="w-3.5 h-3.5" />;
  }
}

export function Timeline() {
  const { match, events, roster, editEvent, deleteEvent } =
    useMatchStore();
  const { clubs } = useAdminStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [editMinute, setEditMinute] = useState("");
  const [editSecond, setEditSecond] = useState("");

  if (!match) return null;

  const isLocked = match.status === "finished";

  const activeEvents = events
    .filter((e) => !e.deletedAt)
    .sort((a, b) => {
      const timeA = a.minute * 60 + a.second;
      const timeB = b.minute * 60 + b.second;
      if (timeA !== timeB) return timeA - timeB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const getPlayer = (rosterId?: string) =>
    rosterId ? roster.find((r) => r.id === rosterId) : null;
  const getClub = (clubId?: string) =>
    clubId ? clubs.find((c) => c.id === clubId) : null;

  // Running score
  let runningHome = 0;
  let runningAway = 0;

  const handleEdit = (event: MatchEvent) => {
    setEditingEvent(event);
    setEditMinute(String(event.minute));
    setEditSecond(String(event.second));
  };

  const confirmEdit = async () => {
    if (!editingEvent) return;
    await editEvent(editingEvent.id, {
      minute: parseInt(editMinute) || 0,
      second: parseInt(editSecond) || 0,
    });
    setEditingEvent(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteEvent(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="mt-2">
      <div className="text-xs font-medium text-[var(--muted-foreground)] mb-3">
        TIMELINE ({activeEvents.length} eventos)
      </div>

      {activeEvents.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
          Nenhum evento registrado.
        </p>
      )}

      {/* Vertical timeline */}
      <div className="relative">
        {activeEvents.map((event, index) => {
          const player = getPlayer(event.rosterId);
          const club = getClub(event.clubId);

          if (event.clubId === match.homeClubId) runningHome += event.points;
          else if (event.clubId === match.awayClubId) runningAway += event.points;

          const circleColor =
            EVENT_CIRCLE_COLOR[event.eventType] ?? "bg-gray-500 text-white";
          const lineColor =
            EVENT_LINE_COLOR[event.eventType] ?? "border-gray-500";
          const isLast = index === activeEvents.length - 1;
          const meta = event.metadata as Record<string, string> | undefined;

          return (
            <div
              key={event.id}
              className="flex gap-3 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
            >
              {/* Minute */}
              <div className="w-12 text-right shrink-0 pt-1">
                <span className="font-mono text-xs font-semibold text-[var(--muted-foreground)] tabular-nums">
                  {formatMinSec(event.minute, event.second)}
                </span>
              </div>

              {/* Circle + Line */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-md ${circleColor}`}
                >
                  <EventIcon type={event.eventType} />
                </div>
                {!isLast && (
                  <div
                    className={`w-0 flex-1 border-l-2 border-dashed my-0.5 min-h-[20px] ${lineColor}`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {EVENT_LABELS[event.eventType]}
                      </span>
                      {event.points > 0 && (
                        <span className="inline-block px-1.5 py-0 rounded text-[10px] font-bold bg-[var(--rugby-gold)] text-black">
                          +{event.points}
                        </span>
                      )}
                      {club && (
                        <span className="text-[10px] font-medium px-1.5 py-0 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                          {club.acronym}
                        </span>
                      )}
                    </div>
                    {player && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--muted)] text-[var(--foreground)] text-[10px] font-bold shrink-0">
                          {player.shirtNumber}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)] truncate">
                          {player.playerName}
                        </span>
                      </div>
                    )}
                    {meta?.reason && (
                      <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 italic">
                        {meta.reason}
                      </div>
                    )}
                    {meta?.substitutionType && (
                      <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                        Tipo: {meta.substitutionType}
                      </div>
                    )}
                  </div>

                  {/* Running score */}
                  {event.points > 0 && (
                    <span className="text-xs font-mono font-semibold text-[var(--muted-foreground)] shrink-0 tabular-nums bg-[var(--muted)] px-1.5 py-0.5 rounded">
                      {runningHome}-{runningAway}
                    </span>
                  )}

                  {/* Actions */}
                  {!isLocked && (
                    <div className="flex gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEdit(event)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => setDeleteId(event.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingEvent}
        onOpenChange={() => setEditingEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Minuto</Label>
                <Input
                  type="number"
                  value={editMinute}
                  onChange={(e) => setEditMinute(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Segundo</Label>
                <Input
                  type="number"
                  value={editSecond}
                  onChange={(e) => setEditSecond(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={confirmEdit}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento sera excluido e o placar recalculado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
