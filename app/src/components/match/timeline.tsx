"use client";

import { useState } from "react";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { EVENT_LABELS } from "@/types";
import type { MatchEvent, EventType } from "@/types";
import { formatMinSec } from "@/lib/format";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";

const EVENT_COLORS: Partial<Record<EventType, string>> = {
  try: "bg-green-100 text-green-800 border-green-200",
  conversion_made: "bg-blue-100 text-blue-800 border-blue-200",
  conversion_missed: "bg-blue-50 text-blue-400 border-blue-100",
  penalty_kick_made: "bg-orange-100 text-orange-800 border-orange-200",
  penalty_kick_missed: "bg-orange-50 text-orange-400 border-orange-100",
  drop_goal_made: "bg-purple-100 text-purple-800 border-purple-200",
  drop_goal_missed: "bg-purple-50 text-purple-400 border-purple-100",
  penalty_try: "bg-red-100 text-red-800 border-red-200",
  yellow_card: "bg-yellow-100 text-yellow-800 border-yellow-200",
  red_card: "bg-red-100 text-red-800 border-red-200",
  temp_red_card: "bg-red-50 text-red-600 border-red-100",
  substitution_out: "bg-zinc-100 text-zinc-600 border-zinc-200",
  substitution_in: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function Timeline() {
  const { match, events, roster, homeScore, awayScore, editEvent, deleteEvent } =
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
    <div className="space-y-1 mt-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        TIMELINE ({activeEvents.length} eventos)
      </div>

      {activeEvents.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum evento registrado.
        </p>
      )}

      {activeEvents.map((event) => {
        const player = getPlayer(event.rosterId);
        const club = getClub(event.clubId);

        if (event.clubId === match.homeClubId) runningHome += event.points;
        else if (event.clubId === match.awayClubId) runningAway += event.points;

        const colorClass =
          EVENT_COLORS[event.eventType] ?? "bg-zinc-50 text-zinc-700 border-zinc-200";
        const meta = event.metadata as Record<string, string> | undefined;

        return (
          <div
            key={event.id}
            className={`flex items-center gap-2 rounded border px-2 py-1.5 text-xs ${colorClass}`}
          >
            {/* Time */}
            <span className="font-mono font-semibold w-10 shrink-0 tabular-nums">
              {formatMinSec(event.minute, event.second)}
            </span>

            {/* Club */}
            <span className="font-medium w-10 shrink-0 text-center">
              {club?.acronym ?? "—"}
            </span>

            {/* Event + Player */}
            <span className="flex-1 truncate">
              {EVENT_LABELS[event.eventType]}
              {event.eventType === "penalty_try" && " (7pts, #00)"}
              {player && ` - #${player.shirtNumber} ${player.playerName}`}
              {meta?.reason && ` [${meta.reason}]`}
              {meta?.substitutionType && ` (${meta.substitutionType})`}
            </span>

            {/* Running score */}
            {event.points > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 h-4 shrink-0">
                {runningHome}-{runningAway}
              </Badge>
            )}

            {/* Actions */}
            {!isLocked && (
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => handleEdit(event)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-destructive"
                  onClick={() => setDeleteId(event.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        );
      })}

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
