"use client";

import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useI18n } from "@/lib/i18n";
import { Calendar, MapPin, Clock, Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  central: "Arbitro",
  ar1: "Ajudante 1",
  ar2: "Ajudante 2",
  tmo: "TMO",
  fourth_official: "4o Oficial",
  judicial_officer: "Oficial Judicial",
  citing_officer: "Oficial de Citacao",
  appeals_officer: "Oficial de Apelacoes",
  match_commissioner: "Comissario",
  scorer: "Planillero",
  doctor: "Medico",
};

export function MatchInfoPanel() {
  const { match, referees } = useMatchStore();
  const { clubs, referees: allReferees, gameTypes, categories, organizingEntities } = useAdminStore();
  const { t } = useI18n();

  if (!match) return null;

  const homeClub = clubs.find((c) => c.id === match.homeClubId);
  const awayClub = clubs.find((c) => c.id === match.awayClubId);
  const gameType = gameTypes.find((g) => g.id === match.gameTypeId);
  const category = categories.find((c) => c.id === match.categoryId);

  // Suppress unused variable warnings
  void homeClub;
  void awayClub;

  const infoItems = [
    { label: t("match.date"), value: match.matchDate ?? "—", icon: Calendar },
    { label: t("match.venue"), value: match.venue ?? "—", icon: MapPin },
    {
      label: t("match.scheduled_start"),
      value: match.scheduledStartTime ?? (match.startTime
        ? new Date(match.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "—"),
      icon: Clock,
    },
    { label: t("match.game_type"), value: gameType?.name ?? "—" },
    { label: t("match.category"), value: category?.name ?? "—" },
    { label: t("match.competition"), value: match.competitionName ?? "—" },
  ];

  // Resolve organizing entity IDs to names
  const entityIds = match.organizingEntityIds ?? [];
  const resolvedEntities = entityIds
    .map((id) => organizingEntities.find((e) => e.id === id))
    .filter(Boolean) as typeof organizingEntities;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 py-3 animate-fade-in-up">
      {/* Match Info */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {t("match.config")}
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {infoItems.map((item) => (
            <div key={item.label}>
              <div className="text-[10px] text-[var(--muted-foreground)] uppercase">
                {item.label}
              </div>
              <div className="text-sm text-[var(--foreground)] font-medium truncate">
                {item.value}
              </div>
            </div>
          ))}
        </div>
        {resolvedEntities.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase mb-1">
              {t("entity.organizing")}
            </div>
            <div className="flex flex-wrap gap-1">
              {resolvedEntities.map((e) => (
                <span
                  key={e.id}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--foreground)] font-medium"
                  title={e.name}
                >
                  {e.acronym}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Officials */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Oficiais
        </h3>
        {referees.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)] italic">
            Nenhum oficial designado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-y-1.5">
            {referees.map((ref) => {
              const refData = allReferees.find((r) => r.id === ref.refereeId);
              return (
                <div key={ref.id} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[var(--muted-foreground)] uppercase shrink-0">
                    {ROLE_LABELS[ref.roleInMatch] ?? ref.roleInMatch}
                  </span>
                  <span className="text-sm text-[var(--foreground)] font-medium truncate">
                    {refData?.name ?? "Por designar"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
