"use client";

import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";
import { useI18n } from "@/lib/i18n";

export function ScorePanel() {
  const { match, events, homeScore, awayScore, shootoutKicks } = useMatchStore();
  const { clubs } = useAdminStore();
  const { t } = useI18n();

  if (!match) return null;

  const home = clubs.find((c) => c.id === match.homeClubId);
  const away = clubs.find((c) => c.id === match.awayClubId);

  // Count tries per team
  const activeEvents = events.filter((e) => !e.deletedAt);
  const homeTries = activeEvents.filter(
    (e) => e.clubId === match.homeClubId && (e.eventType === "try" || e.eventType === "penalty_try")
  ).length;
  const awayTries = activeEvents.filter(
    (e) => e.clubId === match.awayClubId && (e.eventType === "try" || e.eventType === "penalty_try")
  ).length;

  // Shootout score
  const homeShootout = shootoutKicks.filter(
    (k) => k.clubId === match.homeClubId && k.result === "made"
  ).length;
  const awayShootout = shootoutKicks.filter(
    (k) => k.clubId === match.awayClubId && k.result === "made"
  ).length;
  const hasShootout = shootoutKicks.length > 0;

  return (
    <div
      className="px-4 py-6 text-white"
      style={{
        background: "linear-gradient(135deg, #1a2332 0%, #2c3e50 50%, #1a2332 100%)",
      }}
    >
      <div className="flex items-center justify-center gap-4">
        {/* Home Team */}
        <div className="text-center flex-1 min-w-0">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold border-2 shadow-lg"
            style={{
              backgroundColor: home?.primaryColor ?? "#666",
              borderColor: home?.secondaryColor ?? "#999",
            }}
          >
            {home?.acronym?.slice(0, 3) ?? t("match.home_short").slice(0,3).toUpperCase()}
          </div>
          <div className="text-sm font-semibold truncate">
            {home?.name ?? t("match.home")}
          </div>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--rugby-home)] text-white">
            {t("score.home_badge")}
          </span>
        </div>

        {/* Score */}
        <div className="text-center shrink-0">
          <div
            className="text-6xl font-bold font-mono tabular-nums leading-none"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          >
            {homeScore} - {awayScore}
          </div>
          <div className="text-sm text-gray-400 mt-1.5 font-mono">
            ({homeTries}T - {awayTries}T)
          </div>
          {hasShootout && (
            <div className="text-xs text-[var(--rugby-gold)] mt-1 font-medium">
              {t("score.shootout")}: {homeShootout} - {awayShootout}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="text-center flex-1 min-w-0">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold border-2 shadow-lg"
            style={{
              backgroundColor: away?.primaryColor ?? "#666",
              borderColor: away?.secondaryColor ?? "#999",
            }}
          >
            {away?.acronym?.slice(0, 3) ?? t("match.away_short").slice(0,3).toUpperCase()}
          </div>
          <div className="text-sm font-semibold truncate">
            {away?.name ?? t("match.away")}
          </div>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--rugby-away)] text-white">
            {t("score.away_badge")}
          </span>
        </div>
      </div>
    </div>
  );
}
