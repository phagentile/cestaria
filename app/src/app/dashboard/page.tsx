"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { useMatchStore } from "@/stores/match-store";
import { db } from "@/lib/db";
import type { Match, MatchStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { SyncIndicator } from "@/components/sync-indicator";
import { useI18n } from "@/lib/i18n";
import {
  LogOut,
  Plus,
  Settings,
  Eye,
  Search,
  X,
  Trophy,
  Pencil,
  Trash2,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  confirmed: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  live: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 animate-pulse",
  finished: "bg-red-500/20 text-red-300 border border-red-500/30",
  reopened: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
};

const STATUS_FILTERS: MatchStatus[] = ["scheduled", "confirmed", "live", "finished", "reopened"];

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, hasPermission } = useAuthStore();
  const { clubs, loadAll } = useAdminStore();
  const { deleteMatch } = useMatchStore();
  const { t } = useI18n();
  const [matches, setMatches] = useState<Match[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    loadAll();
    db.matches.toArray().then(setMatches);
  }, [user, router, loadAll]);

  const getClubName = (id: string) =>
    clubs.find((c) => c.id === id)?.name ?? "—";
  const getClubAcronym = (id: string) =>
    clubs.find((c) => c.id === id)?.acronym ?? "—";

  const filteredMatches = useMemo(() => {
    let result = matches.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          getClubName(m.homeClubId).toLowerCase().includes(q) ||
          getClubName(m.awayClubId).toLowerCase().includes(q) ||
          (m.competitionName ?? "").toLowerCase().includes(q) ||
          (m.venue ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [matches, statusFilter, search, clubs]);

  const handleDelete = async (id: string) => {
    await deleteMatch(id);
    setMatches((prev) => prev.filter((m) => m.id !== id));
    setDeletingId(null);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--rugby-try)] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">{t("app.name")}</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              {user.name} — {t("role." + user.role)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <SyncIndicator />
          <LocaleToggle />
          <ThemeToggle />
          {hasPermission("manage_master_data") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin")}
            >
              <Settings className="w-4 h-4 mr-1" />
              {t("nav.admin")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="w-4 h-4 mr-1" />
            {t("nav.logout")}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4 space-y-4 animate-fade-in-up">
        {/* Title + New Match */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{t("nav.dashboard")}</h2>
          {hasPermission("create_match") && (
            <Button onClick={() => router.push("/match/new")}>
              <Plus className="w-4 h-4 mr-1" />
              {t("match.new")}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                placeholder={t("ui.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {(search || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                <X className="w-4 h-4 mr-1" />
                {t("ui.close")}
              </Button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                statusFilter === "all"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {t("dashboard.all")} ({matches.length})
            </button>
            {STATUS_FILTERS.map((s) => {
              const count = matches.filter((m) => m.status === s).length;
              if (count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    statusFilter === s
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                  }`}
                >
                  {t("status." + s)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Match Table */}
        {filteredMatches.length === 0 ? (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] py-12 text-center text-[var(--muted-foreground)]">
            {matches.length === 0
              ? `${t("match.no_matches")}${hasPermission("create_match") ? ` ${t("nav.new_match")}.` : ""}`
              : t("match.no_matches")}
          </div>
        ) : (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                      {t("dashboard.matchup")}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hidden md:table-cell">
                      {t("match.competition")}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hidden sm:table-cell">
                      {t("match.date")}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide hidden lg:table-cell">
                      {t("match.venue")}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                      {t("dashboard.status")}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                      {t("ui.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="stagger-children">
                  {filteredMatches.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/match/${m.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--foreground)]">
                            {getClubAcronym(m.homeClubId)}
                          </span>
                          <span className="text-[var(--muted-foreground)] text-xs">vs</span>
                          <span className="font-semibold text-[var(--foreground)]">
                            {getClubAcronym(m.awayClubId)}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5 md:hidden">
                          {m.competitionName ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] hidden md:table-cell">
                        {m.competitionName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] hidden sm:table-cell">
                        {m.matchDate ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] hidden lg:table-cell truncate max-w-[200px]">
                        {m.venue ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[m.status] ?? STATUS_STYLES.scheduled
                          }`}
                        >
                          {t("status." + m.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/match/${m.id}`);
                            }}
                            title={t("ui.view")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {hasPermission("create_match") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/match/${m.id}/edit`);
                              }}
                              title={t("ui.edit")}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {hasPermission("manage_master_data") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(m.id);
                              }}
                              title={t("match.delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("match.delete_confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("match.delete_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("ui.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) handleDelete(deletingId); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("ui.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
