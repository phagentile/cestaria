"use client";

import { useState } from "react";
import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import type { RosterRole } from "@/types";
import { useI18n } from "@/lib/i18n";

export function RosterPanel() {
  const { match, roster, referees, addRosterEntry, removeRosterEntry, addReferee: addMatchRef, removeReferee: removeMatchRef } =
    useMatchStore();
  const { clubs, referees: allReferees } = useAdminStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showAddRef, setShowAddRef] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [clubId, setClubId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [shirtNumber, setShirtNumber] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState<RosterRole>("starter");
  const [staffRole, setStaffRole] = useState("");

  // Ref form
  const [refId, setRefId] = useState("");
  const [refRole, setRefRole] = useState("");

  const { t } = useI18n();

  if (!match) return null;

  const isLocked = match.status === "finished";
  const homeClub = clubs.find((c) => c.id === match.homeClubId);
  const awayClub = clubs.find((c) => c.id === match.awayClubId);

  const homeRoster = roster.filter((r) => r.clubId === match.homeClubId);
  const awayRoster = roster.filter((r) => r.clubId === match.awayClubId);

  const handleAdd = async () => {
    if (!clubId || !playerName || !shirtNumber) return;
    await addRosterEntry({
      matchId: match.id,
      clubId,
      playerName,
      shirtNumber: parseInt(shirtNumber),
      position: position || undefined,
      role,
      staffRole: role === "staff" ? staffRole : undefined,
      active: role === "starter",
    });
    setPlayerName("");
    setShirtNumber("");
    setPosition("");
    setStaffRole("");
  };

  const handleAddRef = async () => {
    if (!refId || !refRole) return;
    await addMatchRef({
      matchId: match.id,
      refereeId: refId,
      roleInMatch: refRole,
    });
    setRefId("");
    setRefRole("");
    setShowAddRef(false);
  };

  const RosterList = ({ items, clubName }: { items: typeof roster; clubName: string }) => {
    const starters = items.filter((r) => r.role === "starter");
    const reserves = items.filter((r) => r.role === "reserve");
    const staff = items.filter((r) => r.role === "staff");

    return (
      <div className="space-y-2">
        <div className="font-semibold text-sm">{clubName}</div>

        {starters.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t("roster.starter").toUpperCase()}</div>
            {starters.map((r) => (
              <RosterRow key={r.id} entry={r} isLocked={isLocked} onDelete={setConfirmDelete} />
            ))}
          </div>
        )}

        {reserves.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 mt-2">{t("roster.reserve").toUpperCase()}</div>
            {reserves.map((r) => (
              <RosterRow key={r.id} entry={r} isLocked={isLocked} onDelete={setConfirmDelete} />
            ))}
          </div>
        )}

        {staff.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 mt-2">{t("roster.staff").toUpperCase()}</div>
            {staff.map((r) => (
              <RosterRow key={r.id} entry={r} isLocked={isLocked} onDelete={setConfirmDelete} />
            ))}
          </div>
        )}

        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("roster.no_records")}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">
          {t("roster.title_short")}
        </div>
        {!isLocked && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
              <Plus className="w-3 h-3 mr-1" />
              {t("roster.add_player_btn")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddRef(true)}>
              <Plus className="w-3 h-3 mr-1" />
              {t("roster.add_referee_btn")}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RosterList items={homeRoster} clubName={homeClub?.name ?? "Casa"} />
        <RosterList items={awayRoster} clubName={awayClub?.name ?? "Visitante"} />
      </div>

      {/* Referees */}
      <div>
        <div className="text-xs text-muted-foreground mb-1 font-medium">{t("roster.add_referee_btn").toUpperCase()}</div>
        {referees.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("roster.no_records")}</p>
        )}
        {referees.map((ref) => {
          const refData = allReferees.find((r) => r.id === ref.refereeId);
          return (
            <div key={ref.id} className="flex items-center gap-2 text-xs py-1">
              <Badge variant="outline" className="text-[10px]">{ref.roleInMatch}</Badge>
              <span>{refData?.name ?? ref.refereeId}</span>
              {!isLocked && (
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto" onClick={() => removeMatchRef(ref.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Player/Staff Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("roster.add_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("match.home")} / {t("match.away")} *</Label>
              <Select value={clubId} onValueChange={(v) => setClubId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ui.search")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match.homeClubId}>{homeClub?.name}</SelectItem>
                  <SelectItem value={match.awayClubId}>{awayClub?.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("roster.role_label")} *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as RosterRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">{t("roster.starter")}</SelectItem>
                  <SelectItem value="reserve">{t("roster.reserve")}</SelectItem>
                  <SelectItem value="staff">{t("roster.staff")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t("roster.number")} *</Label>
                <Input type="number" value={shirtNumber} onChange={(e) => setShirtNumber(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("roster.position")}</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("ui.name")} *</Label>
              <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            </div>
            {role === "staff" && (
              <div className="space-y-1">
                <Label>{t("roster.staff_role")}</Label>
                <Input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
              </div>
            )}
            <Button className="w-full" onClick={handleAdd} disabled={!clubId || !playerName || !shirtNumber}>
              {t("ui.add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Referee Dialog */}
      <Dialog open={showAddRef} onOpenChange={setShowAddRef}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("roster.add_referee_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("roster.add_referee_btn")} *</Label>
              <Select value={refId} onValueChange={(v) => setRefId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ui.search")} />
                </SelectTrigger>
                <SelectContent>
                  {allReferees.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("roster.role_label")} *</Label>
              <Select value={refRole} onValueChange={(v) => setRefRole(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ui.search")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="ar1">Assistente 1</SelectItem>
                  <SelectItem value="ar2">Assistente 2</SelectItem>
                  <SelectItem value="tmo">TMO</SelectItem>
                  <SelectItem value="fourth">4º {t("roster.add_referee_btn")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddRef} disabled={!refId || !refRole}>
              {t("ui.add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("roster.delete_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("roster.delete_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("ui.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDelete) { removeRosterEntry(confirmDelete); setConfirmDelete(null); } }}>
              {t("ui.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RosterRow({
  entry,
  isLocked,
  onDelete,
}: {
  entry: { id: string; shirtNumber: number; playerName: string; position?: string; active: boolean; role: string; staffRole?: string };
  isLocked: boolean;
  onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 text-xs py-0.5">
      <span className="font-mono font-semibold w-6 text-right">#{entry.shirtNumber}</span>
      <span className="flex-1 truncate">
        {entry.playerName}
        {entry.position && <span className="text-muted-foreground"> ({entry.position})</span>}
        {entry.staffRole && <span className="text-muted-foreground"> - {entry.staffRole}</span>}
      </span>
      {!entry.active && entry.role !== "staff" && (
        <Badge variant="outline" className="text-[10px] h-4 px-1">{t("roster.out_badge")}</Badge>
      )}
      {!isLocked && (
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onDelete(entry.id)}>
          <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      )}
    </div>
  );
}
