"use client";
import { useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { useMatchStore } from "@/stores/match-store";
import { MatchHeader } from "@/components/match/match-header";
import { MatchInfoPanel } from "@/components/match/match-info-panel";
import { ScorePanel } from "@/components/match/score-panel";
import { ActionPanel } from "@/components/match/action-panel";
import { TimerPanel } from "@/components/match/timer-panel";
import { Timeline } from "@/components/match/timeline";
import { RosterPanel } from "@/components/match/roster-panel";
import { ShootoutPanel } from "@/components/match/shootout-panel";
import { ExportPanel } from "@/components/match/export-panel";
import { ClockResolutionPopups } from "@/components/match/clock-resolution-popups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";

export default function MatchControlPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const { user } = useAuthStore();
  const { loadAll } = useAdminStore();
  const { match, loadMatch, tickClock, checkMedicalClocks } = useMatchStore();
  const { t } = useI18n();
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    if (matchId && matchId !== "new") {
      loadAll();
      loadMatch(matchId);
    }
  }, [user, matchId, router, loadAll, loadMatch]);

  // Game clock loop
  const loop = useCallback(
    (timestamp: number) => {
      if (lastTickRef.current === 0) {
        lastTickRef.current = timestamp;
      }
      const delta = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;

      tickClock(delta);
      checkMedicalClocks();

      rafRef.current = requestAnimationFrame(loop);
    },
    [tickClock, checkMedicalClocks]
  );

  useEffect(() => {
    lastTickRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  // Handle visibility change (background tab drift correction)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        lastTickRef.current = 0;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  if (!user || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">{t("ui.loading_match")}</p>
      </div>
    );
  }

  const isLocked = match.status === "finished";

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Popups de resolução de relógios (disciplinar e médico) */}
      <ClockResolutionPopups />

      <MatchHeader />

      {/* Match Info + Officials (2-column grid) */}
      <MatchInfoPanel />

      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Left: Score + Actions */}
        <div className="lg:w-[420px] border-r border-[var(--border)] flex flex-col">
          <ScorePanel />
          <ActionPanel />
          <TimerPanel />
        </div>

        {/* Right: Timeline + Tabs */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2 grid grid-cols-4">
              <TabsTrigger value="timeline">{t("tab.timeline")}</TabsTrigger>
              <TabsTrigger value="roster">{t("tab.roster")}</TabsTrigger>
              <TabsTrigger value="shootout">{t("tab.shootout")}</TabsTrigger>
              <TabsTrigger value="export">{t("tab.export")}</TabsTrigger>
            </TabsList>
            <TabsContent
              value="timeline"
              className="flex-1 px-4 pb-4 overflow-auto"
            >
              <Timeline />
            </TabsContent>
            <TabsContent
              value="roster"
              className="flex-1 px-4 pb-4 overflow-auto"
            >
              <RosterPanel />
            </TabsContent>
            <TabsContent
              value="shootout"
              className="flex-1 px-4 pb-4 overflow-auto"
            >
              <ShootoutPanel />
            </TabsContent>
            <TabsContent
              value="export"
              className="flex-1 px-4 pb-4 overflow-auto"
            >
              <ExportPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
