"use client";

import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EVENT_LABELS } from "@/types";
import { formatMinSec } from "@/lib/format";
import { toast } from "sonner";
import { Download, FileText, AlertTriangle, FileCheck } from "lucide-react";

export function ExportPanel() {
  const {
    match,
    events,
    roster,
    referees,
    homeScore,
    awayScore,
    shootoutKicks,
  } = useMatchStore();
  const {
    clubs,
    referees: allReferees,
    gameTypes,
    categories,
  } = useAdminStore();

  const { t } = useI18n();

  if (!match) return null;

  const homeClub = clubs.find((c) => c.id === match.homeClubId);
  const awayClub = clubs.find((c) => c.id === match.awayClubId);
  const gameType = gameTypes.find((g) => g.id === match.gameTypeId);
  const category = categories.find((c) => c.id === match.categoryId);

  const activeEvents = events
    .filter((e) => !e.deletedAt)
    .sort((a, b) => a.minute * 60 + a.second - (b.minute * 60 + b.second));

  // Check export criteria
  const minRequired = gameType?.name === "Sevens" ? 14 : 80;
  const clockMinutes = Math.floor((match.clockSeconds ?? 0) / 60);
  const hasMinTime = clockMinutes >= minRequired;
  const hasStartTime = !!match.startTime;
  const hasEndTime = !!match.endTime;
  const allCriteriaMet = hasMinTime && hasStartTime && hasEndTime;

  const getPlayer = (rosterId?: string) =>
    rosterId ? roster.find((r) => r.id === rosterId) : null;
  const getClub = (clubId?: string) =>
    clubId ? clubs.find((c) => c.id === clubId) : null;

  const generateTimelineText = () => {
    let text = `RUGBY MATCH PRO — ${t("export.report_events")}\n`;
    text += `${"=".repeat(60)}\n`;
    text += `${homeClub?.name ?? t("match.home_short")} ${homeScore} x ${awayScore} ${awayClub?.name ?? t("match.away_short")}\n`;
    if (match.competitionName)
      text += `${t("export.report_competition")}: ${match.competitionName}\n`;
    if (match.venue) text += `${t("export.report_venue")}: ${match.venue}\n`;
    if (match.matchDate) text += `${t("export.report_date")}: ${match.matchDate}\n`;
    text += `${t("export.report_type")}: ${gameType?.name ?? "—"} | ${t("export.report_category")}: ${category?.name ?? "—"}\n`;
    text += `${"=".repeat(60)}\n\n`;
    text += `${t("export.report_col_time").padEnd(6)} | ${t("export.report_col_team").padEnd(10)} | ${t("export.report_col_event").padEnd(33)} | ${t("export.report_col_score")}\n`;
    text += `${"-".repeat(60)}\n`;

    let runHome = 0;
    let runAway = 0;

    for (const evt of activeEvents) {
      const club = getClub(evt.clubId);
      const player = getPlayer(evt.rosterId);

      if (evt.clubId === match.homeClubId) runHome += evt.points;
      else if (evt.clubId === match.awayClubId) runAway += evt.points;

      const time = formatMinSec(evt.minute, evt.second);
      const teamName = (club?.acronym ?? "—").padEnd(10);
      let eventDesc = EVENT_LABELS[evt.eventType];
      if (player)
        eventDesc += ` - #${player.shirtNumber} ${player.playerName}`;
      if (evt.eventType === "penalty_try") eventDesc += " (#00)";
      eventDesc = eventDesc.padEnd(33);
      const score = `${runHome}-${runAway}`;

      text += `${time}  | ${teamName} | ${eventDesc} | ${score}\n`;
    }

    return text;
  };

  const generateSumulaText = () => {
    let text = `RUGBY MATCH PRO — ${t("export.report_sumula")}\n`;
    text += `${"=".repeat(60)}\n\n`;
    text += `${homeClub?.name ?? t("match.home_short")} ${homeScore} x ${awayScore} ${awayClub?.name ?? t("match.away_short")}\n`;
    if (shootoutKicks.length > 0) {
      const hk = shootoutKicks.filter(
        (k) => k.clubId === match.homeClubId && k.result === "made"
      ).length;
      const ak = shootoutKicks.filter(
        (k) => k.clubId === match.awayClubId && k.result === "made"
      ).length;
      text += `${t("export.report_shootout")}: (${hk}-${ak})\n`;
    }
    text += `\n`;
    if (match.competitionName)
      text += `${t("export.report_competition")}: ${match.competitionName}\n`;
    if (category) text += `${t("export.report_category")}: ${category.name}\n`;
    text += `${t("export.report_type")}: ${gameType?.name ?? "—"}\n`;
    if (match.venue) text += `${t("export.report_venue")}: ${match.venue}\n`;
    if (match.matchDate) text += `${t("export.report_date")}: ${match.matchDate}\n`;
    if (match.startTime)
      text += `${t("export.report_start")}: ${new Date(match.startTime).toLocaleTimeString()}\n`;
    if (match.endTime)
      text += `${t("export.report_end")}: ${new Date(match.endTime).toLocaleTimeString()}\n`;
    text += `\n`;

    for (const [clubId, label] of [
      [match.homeClubId, homeClub?.name ?? t("match.home_short")],
      [match.awayClubId, awayClub?.name ?? t("match.away_short")],
    ] as const) {
      text += `${"—".repeat(30)}\n`;
      text += `${label}\n`;
      text += `${"—".repeat(30)}\n`;

      const teamRoster = roster.filter((r) => r.clubId === clubId);
      const starters = teamRoster.filter((r) => r.role === "starter");
      const reserves = teamRoster.filter((r) => r.role === "reserve");
      const staff = teamRoster.filter((r) => r.role === "staff");

      if (starters.length > 0) {
        text += `\n${t("export.report_starters")}:\n`;
        for (const r of starters.sort((a, b) => a.shirtNumber - b.shirtNumber)) {
          text += `  #${String(r.shirtNumber).padStart(2)} ${r.playerName}${r.position ? ` (${r.position})` : ""}\n`;
        }
      }
      if (reserves.length > 0) {
        text += `\n${t("export.report_reserves")}:\n`;
        for (const r of reserves.sort((a, b) => a.shirtNumber - b.shirtNumber)) {
          text += `  #${String(r.shirtNumber).padStart(2)} ${r.playerName}${r.position ? ` (${r.position})` : ""}\n`;
        }
      }
      if (staff.length > 0) {
        text += `\n${t("export.report_staff")}:\n`;
        for (const r of staff) {
          text += `  ${r.playerName}${r.staffRole ? ` - ${r.staffRole}` : ""}\n`;
        }
      }
      text += `\n`;
    }

    if (referees.length > 0) {
      text += `${"—".repeat(30)}\n`;
      text += `${t("export.report_referees")}\n`;
      text += `${"—".repeat(30)}\n`;
      for (const ref of referees) {
        const refData = allReferees.find((r) => r.id === ref.refereeId);
        text += `  ${ref.roleInMatch}: ${refData?.name ?? "—"}\n`;
      }
    }

    return text;
  };

  const download = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTimeline = () => {
    download(
      `cestaria_timeline_${match.id.slice(0, 8)}.txt`,
      generateTimelineText()
    );
    toast.success(t("export.toast_timeline"));
  };

  const handleExportSumula = () => {
    download(
      `rmatch_sumula_${match.id.slice(0, 8)}.txt`,
      generateSumulaText()
    );
    toast.success(t("export.toast_sumula"));
  };

  const handleExportComplete = () => {
    const complete = generateSumulaText() + "\n\n" + generateTimelineText();
    download(
      `rmatch_completo_${match.id.slice(0, 8)}.txt`,
      complete
    );
    toast.success(t("export.toast_complete"));
  };

  return (
    <div className="space-y-4 mt-2 animate-fade-in-up">
      <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
        {t("export.title")}
      </div>

      {/* Criteria check */}
      {!allCriteriaMet && (
        <div className="bg-[var(--rugby-yellow-card)]/10 border border-[var(--rugby-yellow-card)]/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--rugby-yellow-card)] mt-0.5 shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-[var(--rugby-yellow-card)] mb-1">
              {t("export.criteria")}
            </div>
            <div className={hasMinTime ? "line-through opacity-40 text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}>
              {t("export.min_time")}: {minRequired} min ({clockMinutes} min)
            </div>
            <div className={hasStartTime ? "line-through opacity-40 text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}>
              {t("export.start_time")}
            </div>
            <div className={hasEndTime ? "line-through opacity-40 text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}>
              {t("export.end_time")}
            </div>
            <div className="mt-1 text-[var(--muted-foreground)] italic">
              {t("export.can_export")}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-2 stagger-children">
        <Button
          variant="outline"
          className="justify-start h-auto py-3 hover:bg-[var(--accent)] transition-all duration-200"
          onClick={handleExportTimeline}
        >
          <FileText className="w-4 h-4 mr-2 shrink-0 text-[var(--rugby-conversion)]" />
          <div className="text-left flex-1">
            <div className="text-sm font-medium">{t("export.timeline_btn")}</div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {t("export.timeline_desc")}
            </div>
          </div>
          <Download className="w-4 h-4 ml-auto shrink-0" />
        </Button>

        <Button
          variant="outline"
          className="justify-start h-auto py-3 hover:bg-[var(--accent)] transition-all duration-200"
          onClick={handleExportSumula}
        >
          <FileCheck className="w-4 h-4 mr-2 shrink-0 text-[var(--rugby-try)]" />
          <div className="text-left flex-1">
            <div className="text-sm font-medium">{t("export.sumula_btn")}</div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {t("export.sumula_desc")}
            </div>
          </div>
          <Download className="w-4 h-4 ml-auto shrink-0" />
        </Button>

        <Button
          variant="outline"
          className="justify-start h-auto py-3 hover:bg-[var(--accent)] transition-all duration-200"
          onClick={handleExportComplete}
        >
          <FileText className="w-4 h-4 mr-2 shrink-0 text-[var(--rugby-drop)]" />
          <div className="text-left flex-1">
            <div className="text-sm font-medium">{t("export.complete_btn")}</div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {t("export.complete_desc")}
            </div>
          </div>
          <Download className="w-4 h-4 ml-auto shrink-0" />
        </Button>
      </div>
    </div>
  );
}
