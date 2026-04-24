"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { useMatchStore } from "@/stores/match-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OrganizingEntitySelector } from "@/components/organizing-entity-selector";
import { ZoneOfficialsSelector } from "@/components/zone-officials-selector";
import { MatchSheetImporter } from "@/components/match/match-sheet-importer";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";

export default function EditMatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const { user } = useAuthStore();
  const { clubs, gameTypes, categories, loadAll } = useAdminStore();
  const { match, loadMatch, updateMatch } = useMatchStore();
  const { t } = useI18n();

  const [homeClubId, setHomeClubId] = useState("");
  const [awayClubId, setAwayClubId] = useState("");
  const [gameTypeId, setGameTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [competitionName, setCompetitionName] = useState("");
  const [organizingEntityIds, setOrganizingEntityIds] = useState<string[]>([]);
  const [venue, setVenue] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    loadAll();
    if (matchId) loadMatch(matchId);
  }, [user, matchId, router, loadAll, loadMatch]);

  useEffect(() => {
    if (!match) return;
    setHomeClubId(match.homeClubId);
    setAwayClubId(match.awayClubId);
    setGameTypeId(match.gameTypeId);
    setCategoryId(match.categoryId ?? "");
    setCompetitionName(match.competitionName ?? "");
    setOrganizingEntityIds(match.organizingEntityIds ?? []);
    setVenue(match.venue ?? "");
    setMatchDate(match.matchDate ?? "");
    setScheduledStartTime(match.scheduledStartTime ?? "");
  }, [match]);

  const handleSave = async () => {
    if (!match) return;
    setBusy(true);
    try {
      await updateMatch({
        ...match,
        homeClubId,
        awayClubId,
        gameTypeId,
        categoryId: categoryId || undefined,
        competitionName: competitionName || undefined,
        organizingEntityIds: organizingEntityIds.length > 0 ? organizingEntityIds : undefined,
        venue: venue || undefined,
        matchDate: matchDate || undefined,
        scheduledStartTime: scheduledStartTime || undefined,
        updatedAt: new Date().toISOString(),
      });
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  if (!user || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">{t("ui.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold text-[var(--foreground)] flex-1">{t("match.edit")}</h1>
        <LocaleToggle />
        <ThemeToggle />
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("match.config")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("match.home")} *</Label>
                <Select value={homeClubId} onValueChange={(v) => setHomeClubId(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("match.away")} *</Label>
                <Select value={awayClubId} onValueChange={(v) => setAwayClubId(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {clubs.filter((c) => c.id !== homeClubId).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("match.game_type")} *</Label>
                <Select value={gameTypeId} onValueChange={(v) => setGameTypeId(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {gameTypes.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("match.category")}</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder={t("match.select_category")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t("match.competition")}</Label>
              <Input value={competitionName} onChange={(e) => setCompetitionName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>{t("entity.organizing")}</Label>
              <OrganizingEntitySelector selected={organizingEntityIds} onChange={setOrganizingEntityIds} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("match.venue")}</Label>
                <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("match.date")}</Label>
                <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t("match.scheduled_start")}</Label>
              <Input type="time" value={scheduledStartTime} onChange={(e) => setScheduledStartTime(e.target.value)} className="w-40" />
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <MatchSheetImporter
                matchId={matchId}
                homeClubId={homeClubId}
                awayClubId={awayClubId}
                homeClubName={clubs.find((c) => c.id === homeClubId)?.name ?? t("match.home_short")}
                awayClubName={clubs.find((c) => c.id === awayClubId)?.name ?? t("match.away_short")}
              />
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <ZoneOfficialsSelector matchId={matchId} />
            </div>

            <Button className="w-full mt-4" onClick={() => setShowConfirm(true)} disabled={busy}>
              {t("ui.save")}
            </Button>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("match.edit_confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("match.edit_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("ui.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={busy}>
              {busy ? t("ui.saving") : t("ui.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
