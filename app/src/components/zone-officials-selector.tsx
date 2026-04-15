"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { pushRow, enqueuePush } from "@/lib/sync";
import type { MatchZoneOfficial, MatchZoneRole, User } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserCheck } from "lucide-react";

const ZONE_ROLES: { role: MatchZoneRole; label: string; description: string; group: string }[] = [
  // ── Árbitro ──────────────────────────────────────────────────────────────
  {
    role: "quarto_arbitro",
    label: "4º Árbitro",
    description: "Controla relógio, placar, cartões e aprovação de subs",
    group: "Árbitro",
  },
  // ── Sideline Manager ─────────────────────────────────────────────────────
  {
    role: "sideline_official_both",
    label: "Sideline Manager — Ambos os Times",
    description: "1 Appointed: único oficial, controla os dois lados",
    group: "Sideline Manager",
  },
  {
    role: "sideline_official_a",
    label: "Sideline Manager — Time A",
    description: "Gerencia linha e substituições do Time A",
    group: "Sideline Manager",
  },
  {
    role: "sideline_official_b",
    label: "Sideline Manager — Time B",
    description: "Gerencia linha e substituições do Time B",
    group: "Sideline Manager",
  },
  // ── Technical Zone Controller ─────────────────────────────────────────────
  {
    role: "technical_zone_controller_a",
    label: "Technical Zone Controller — Time A",
    description: "Supervisiona a zona técnica do Time A",
    group: "Technical Zone Controller",
  },
  {
    role: "technical_zone_controller_b",
    label: "Technical Zone Controller — Time B",
    description: "Supervisiona a zona técnica do Time B",
    group: "Technical Zone Controller",
  },
  // ── Team Manager ──────────────────────────────────────────────────────────
  {
    role: "team_manager_a",
    label: "Team Manager — Time A",
    description: "Solicita substituições do Time A",
    group: "Team Manager",
  },
  {
    role: "team_manager_b",
    label: "Team Manager — Time B",
    description: "Solicita substituições do Time B",
    group: "Team Manager",
  },
];

interface Props {
  matchId: string;
}

export function ZoneOfficialsSelector({ matchId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [officials, setOfficials] = useState<MatchZoneOfficial[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    db.users.toArray().then(setUsers);
    db.matchZoneOfficials.where("matchId").equals(matchId).toArray().then(setOfficials);
  }, [matchId]);

  const getAssigned = (role: MatchZoneRole) =>
    officials.find((o) => o.role === role)?.userId ?? "";

  const handleChange = async (role: MatchZoneRole, userId: string) => {
    setBusy(true);
    try {
      // Remove existing entry for this role in this match
      const existing = officials.find((o) => o.role === role);
      if (existing) {
        await db.matchZoneOfficials.delete(existing.id);
        await pushRow("match_zone_officials", { id: existing.id }, "delete");
      }

      if (userId && userId !== "__none__") {
        const newEntry: MatchZoneOfficial = {
          id: `mzo-${matchId}-${role}`,
          matchId,
          userId,
          role,
          createdAt: new Date().toISOString(),
        };
        await db.matchZoneOfficials.put(newEntry);
        const ok = await pushRow("match_zone_officials", newEntry as unknown as Record<string, unknown>);
        if (!ok) enqueuePush("match_zone_officials", newEntry as unknown as Record<string, unknown>);
      }

      // Refresh
      const updated = await db.matchZoneOfficials.where("matchId").equals(matchId).toArray();
      setOfficials(updated);
    } finally {
      setBusy(false);
    }
  };

  // Agrupa papéis por grupo
  const groups = ZONE_ROLES.reduce<Record<string, typeof ZONE_ROLES>>((acc, r) => {
    if (!acc[r.group]) acc[r.group] = [];
    acc[r.group].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <UserCheck className="w-4 h-4" />
        Oficiais da Zona Técnica
      </div>

      {Object.entries(groups).map(([groupName, roles]) => (
        <div key={groupName} className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] border-b border-[var(--border)] pb-1">
            {groupName}
          </div>
          {roles.map(({ role, label, description }) => (
            <div key={role} className="grid grid-cols-[1fr_auto] gap-3 items-center pl-1">
              <div>
                <div className="text-xs font-medium text-[var(--foreground)]">{label}</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">{description}</div>
              </div>
              <Select
                value={getAssigned(role)}
                onValueChange={(v) => handleChange(role, v ?? "")}
                disabled={busy}
              >
                <SelectTrigger className="w-48 text-xs">
                  <SelectValue placeholder="— Não designado —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Não designado —</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
