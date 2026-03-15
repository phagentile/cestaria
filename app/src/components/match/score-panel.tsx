"use client";

import { useMatchStore } from "@/stores/match-store";
import { useAdminStore } from "@/stores/admin-store";

export function ScorePanel() {
  const { match, homeScore, awayScore, shootoutKicks } = useMatchStore();
  const { clubs } = useAdminStore();

  if (!match) return null;

  const home = clubs.find((c) => c.id === match.homeClubId);
  const away = clubs.find((c) => c.id === match.awayClubId);

  // Shootout score
  const homeShootout = shootoutKicks.filter(
    (k) => k.clubId === match.homeClubId && k.result === "made"
  ).length;
  const awayShootout = shootoutKicks.filter(
    (k) => k.clubId === match.awayClubId && k.result === "made"
  ).length;
  const hasShootout = shootoutKicks.length > 0;

  return (
    <div className="bg-zinc-900 text-white px-4 py-6">
      <div className="flex items-center justify-center gap-6">
        {/* Home */}
        <div className="text-center flex-1">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold border-2"
            style={{
              backgroundColor: home?.primaryColor ?? "#666",
              borderColor: home?.secondaryColor ?? "#999",
            }}
          >
            {home?.acronym?.slice(0, 3) ?? "CAS"}
          </div>
          <div className="text-sm font-medium truncate">
            {home?.name ?? "Time da Casa"}
          </div>
        </div>

        {/* Score */}
        <div className="text-center">
          <div className="text-5xl font-bold font-mono tabular-nums">
            {homeScore} - {awayScore}
          </div>
          {hasShootout && (
            <div className="text-sm text-zinc-400 mt-1">
              ({homeShootout} - {awayShootout})
            </div>
          )}
        </div>

        {/* Away */}
        <div className="text-center flex-1">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold border-2"
            style={{
              backgroundColor: away?.primaryColor ?? "#666",
              borderColor: away?.secondaryColor ?? "#999",
            }}
          >
            {away?.acronym?.slice(0, 3) ?? "VIS"}
          </div>
          <div className="text-sm font-medium truncate">
            {away?.name ?? "Time Visitante"}
          </div>
        </div>
      </div>
    </div>
  );
}
