"use client";

import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EVENT_LABELS } from "@/types";
import { formatMinSec } from "@/lib/format";
import { Download, FileText, AlertTriangle } from "lucide-react";

export function ExportPanel() {
  const { match, events, roster, referees, homeScore, awayScore, shootoutKicks } =
    useMatchStore();
  const { clubs, referees: allReferees, gameTypes, categories } = useAdminStore();

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
    let text = `CESTARIA — RELATORIO DE EVENTOS\n`;
    text += `${"=".repeat(60)}\n`;
    text += `${homeClub?.name ?? "Casa"} ${homeScore} x ${awayScore} ${awayClub?.name ?? "Visitante"}\n`;
    if (match.competitionName) text += `Competicao: ${match.competitionName}\n`;
    if (match.venue) text += `Local: ${match.venue}\n`;
    if (match.matchDate) text += `Data: ${match.matchDate}\n`;
    text += `Tipo: ${gameType?.name ?? "—"} | Categoria: ${category?.name ?? "—"}\n`;
    text += `${"=".repeat(60)}\n\n`;
    text += `TEMPO  | TIME       | EVENTO                          | PLACAR\n`;
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
      if (player) eventDesc += ` - #${player.shirtNumber} ${player.playerName}`;
      if (evt.eventType === "penalty_try") eventDesc += " (#00)";
      eventDesc = eventDesc.padEnd(33);
      const score = `${runHome}-${runAway}`;

      text += `${time}  | ${teamName} | ${eventDesc} | ${score}\n`;
    }

    return text;
  };

  const generateSumulaText = () => {
    let text = `CESTARIA — SUMULA OFICIAL\n`;
    text += `${"=".repeat(60)}\n\n`;
    text += `${homeClub?.name ?? "Casa"} ${homeScore} x ${awayScore} ${awayClub?.name ?? "Visitante"}\n`;
    if (shootoutKicks.length > 0) {
      const hk = shootoutKicks.filter(k => k.clubId === match.homeClubId && k.result === "made").length;
      const ak = shootoutKicks.filter(k => k.clubId === match.awayClubId && k.result === "made").length;
      text += `Penais: (${hk}-${ak})\n`;
    }
    text += `\n`;
    if (match.competitionName) text += `Competicao: ${match.competitionName}\n`;
    if (category) text += `Categoria: ${category.name}\n`;
    text += `Tipo: ${gameType?.name ?? "—"}\n`;
    if (match.venue) text += `Local: ${match.venue}\n`;
    if (match.matchDate) text += `Data: ${match.matchDate}\n`;
    if (match.startTime) text += `Inicio: ${new Date(match.startTime).toLocaleTimeString("pt-BR")}\n`;
    if (match.endTime) text += `Fim: ${new Date(match.endTime).toLocaleTimeString("pt-BR")}\n`;
    text += `\n`;

    // Teams
    for (const [clubId, label] of [
      [match.homeClubId, homeClub?.name ?? "Casa"],
      [match.awayClubId, awayClub?.name ?? "Visitante"],
    ] as const) {
      text += `${"—".repeat(30)}\n`;
      text += `${label}\n`;
      text += `${"—".repeat(30)}\n`;

      const teamRoster = roster.filter((r) => r.clubId === clubId);
      const starters = teamRoster.filter((r) => r.role === "starter");
      const reserves = teamRoster.filter((r) => r.role === "reserve");
      const staff = teamRoster.filter((r) => r.role === "staff");

      if (starters.length > 0) {
        text += `\nTitulares:\n`;
        for (const r of starters.sort((a, b) => a.shirtNumber - b.shirtNumber)) {
          text += `  #${String(r.shirtNumber).padStart(2)} ${r.playerName}${r.position ? ` (${r.position})` : ""}\n`;
        }
      }
      if (reserves.length > 0) {
        text += `\nReservas:\n`;
        for (const r of reserves.sort((a, b) => a.shirtNumber - b.shirtNumber)) {
          text += `  #${String(r.shirtNumber).padStart(2)} ${r.playerName}${r.position ? ` (${r.position})` : ""}\n`;
        }
      }
      if (staff.length > 0) {
        text += `\nComissao Tecnica:\n`;
        for (const r of staff) {
          text += `  ${r.playerName}${r.staffRole ? ` - ${r.staffRole}` : ""}\n`;
        }
      }
      text += `\n`;
    }

    // Referees
    if (referees.length > 0) {
      text += `${"—".repeat(30)}\n`;
      text += `ARBITROS\n`;
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
  };

  const handleExportSumula = () => {
    download(
      `cestaria_sumula_${match.id.slice(0, 8)}.txt`,
      generateSumulaText()
    );
  };

  const handleExportComplete = () => {
    const complete = generateSumulaText() + "\n\n" + generateTimelineText();
    download(
      `cestaria_completo_${match.id.slice(0, 8)}.txt`,
      complete
    );
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="text-xs font-medium text-muted-foreground">
        EXPORTACAO
      </div>

      {/* Criteria check */}
      {!allCriteriaMet && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-xs text-yellow-800">
              <div className="font-medium mb-1">Criterios de exportacao:</div>
              <div className={hasMinTime ? "line-through opacity-50" : ""}>
                Tempo minimo: {minRequired} min (atual: {clockMinutes} min)
              </div>
              <div className={hasStartTime ? "line-through opacity-50" : ""}>
                Hora de inicio registrada
              </div>
              <div className={hasEndTime ? "line-through opacity-50" : ""}>
                Hora de fim registrada
              </div>
              <div className="mt-1 text-yellow-600 italic">
                Voce ainda pode exportar mesmo sem atender todos os criterios.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-2">
        <Button
          variant="outline"
          className="justify-start h-auto py-3"
          onClick={handleExportTimeline}
        >
          <FileText className="w-4 h-4 mr-2 shrink-0" />
          <div className="text-left">
            <div className="text-sm font-medium">Timeline de Eventos</div>
            <div className="text-xs text-muted-foreground">
              Lista cronologica de todos os eventos
            </div>
          </div>
          <Download className="w-4 h-4 ml-auto shrink-0" />
        </Button>

        <Button
          variant="outline"
          className="justify-start h-auto py-3"
          onClick={handleExportSumula}
        >
          <FileText className="w-4 h-4 mr-2 shrink-0" />
          <div className="text-left">
            <div className="text-sm font-medium">Sumula Oficial</div>
            <div className="text-xs text-muted-foreground">
              Dados dos clubes, atletas, comissao e arbitros
            </div>
          </div>
          <Download className="w-4 h-4 ml-auto shrink-0" />
        </Button>

        <Button
          variant="outline"
          className="justify-start h-auto py-3"
          onClick={handleExportComplete}
        >
          <FileText className="w-4 h-4 mr-2 shrink-0" />
          <div className="text-left">
            <div className="text-sm font-medium">Relatorio Completo</div>
            <div className="text-xs text-muted-foreground">
              Sumula + Timeline de eventos
            </div>
          </div>
          <Download className="w-4 h-4 ml-auto shrink-0" />
        </Button>
      </div>
    </div>
  );
}
