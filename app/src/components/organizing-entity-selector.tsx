"use client";
import { useAdminStore } from "@/stores/admin-store";
import { useI18n } from "@/lib/i18n";
import type { EntityLevel } from "@/types";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

const LEVELS: EntityLevel[] = ["world", "continental", "national", "state", "regional"];

export function OrganizingEntitySelector({ selected, onChange }: Props) {
  const { organizingEntities } = useAdminStore();
  const { t } = useI18n();

  const LEVEL_LABEL_KEYS: Record<EntityLevel, string> = {
    world: "entity.world",
    continental: "entity.continental",
    national: "entity.national",
    state: "entity.state",
    regional: "entity.regional",
  };

  return (
    <div className="space-y-2">
      {LEVELS.map((level) => {
        const items = organizingEntities.filter((e) => e.level === level);
        if (items.length === 0) return null;
        return (
          <div key={level}>
            <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
              {t(LEVEL_LABEL_KEYS[level])}
            </p>
            <div className="border border-[var(--border)] rounded-md max-h-28 overflow-y-auto p-1 bg-[var(--card)]">
              {items.map((entity) => {
                const checked = selected.includes(entity.id);
                return (
                  <label
                    key={entity.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onChange(
                          checked
                            ? selected.filter((id) => id !== entity.id)
                            : [...selected, entity.id]
                        )
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm flex-1">{entity.name}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                      {entity.acronym}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
