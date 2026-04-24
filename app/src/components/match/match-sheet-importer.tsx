"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMatchStore } from "@/stores/match-store";
import { toast } from "sonner";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ParsedPlayer {
  shirtNumber: number;
  playerName: string;
  role: "starter" | "reserve" | "staff";
  staffRole?: string;
}

interface ParsedTeam {
  label: string;
  players: ParsedPlayer[];
}

interface ParseResult {
  teamA: ParsedTeam;
  teamB: ParsedTeam;
}

// ---------------------------------------------------------------------------
// Text item with position
// ---------------------------------------------------------------------------
interface TextItem {
  str: string;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// PDF extraction — keeps X/Y coordinates of each text item
// ---------------------------------------------------------------------------
async function extractItems(file: File): Promise<TextItem[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const all: TextItem[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      // transform: [a,b,c,d,e,f] — e=x, f=y (PDF coords, origin bottom-left)
      const x = item.transform[4];
      const y = vp.height - item.transform[5]; // flip to top-left origin
      all.push({ str: item.str.trim(), x, y });
    }
  }
  // Sort top→bottom, then left→right within same row (±4px tolerance)
  all.sort((a, b) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 4) return dy;
    return a.x - b.x;
  });
  return all;
}

// ---------------------------------------------------------------------------
// Group items into logical lines (items within 4px vertical tolerance)
// ---------------------------------------------------------------------------
interface Line {
  y: number;
  items: TextItem[];
  text: string; // full concatenated text of the line
}

function groupIntoLines(items: TextItem[]): Line[] {
  const lines: Line[] = [];
  for (const item of items) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(item.y - last.y) <= 4) {
      last.items.push(item);
      last.text += " " + item.str;
    } else {
      lines.push({ y: item.y, items: [item], text: item.str });
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Determine page midpoint X to split columns
// ---------------------------------------------------------------------------
function findMidX(items: TextItem[]): number {
  const xs = items.map((i) => i.x);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  return (min + max) / 2;
}

// ---------------------------------------------------------------------------
// Parse a single column's lines into players
// ---------------------------------------------------------------------------
function parseColumn(lines: string[]): ParsedPlayer[] {
  const players: ParsedPlayer[] = [];
  let role: "starter" | "reserve" | "staff" = "starter";

  const playerRe = /^(\d{1,2})\s+(.+)$/;
  // Staff: "— Name — ROLE" or "Name — ROLE" or "— Name – ROLE"
  const staffRe = /^[—–-]?\s*(.+?)\s+[—–-]+\s+(.+)$/;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const up = line.toUpperCase();

    // Section markers
    if (up.includes("SUPLENTE") || up.includes("SUBSTITUTE") || up.includes("RESERVE")) {
      role = "reserve";
      continue;
    }
    if (up === "STAFF" || up.startsWith("STAFF ")) {
      role = "staff";
      continue;
    }

    // Skip header/meta lines
    if (
      up.includes("MATCH SHEET") || up.includes("ÁRBITRO") || up.includes("ASISTENTE") ||
      up.includes("PLANILLERO") || up.includes("MÉDICO") || up.includes("MÉDICO") ||
      up.includes("LOCAL") || up.includes("VISITANTE") || up.includes("RESULTADO") ||
      up.includes("SUPER RUGBY") || up.includes("PARTIDO") || up.includes("FECHA") ||
      up.includes("LUGAR") || up.includes("TMO") || up.includes("COMMISSIONER") ||
      up.includes("JUDICIAL") || up.includes("CITACI") || up.includes("APELACI") ||
      up.includes("SAR 4N") || up.includes("TEAM A") || up.includes("TEAM B") ||
      up.includes("AMERICAS") || up.match(/^\d{2}\/\d{2}\/\d{4}/) ||
      up.match(/^(A|B|19|48|31)$/) // score/partido numbers
    ) {
      continue;
    }

    if (role === "staff") {
      const m = line.match(staffRe);
      if (m) {
        players.push({
          shirtNumber: 0,
          playerName: m[1].trim(),
          role: "staff",
          staffRole: m[2].trim(),
        });
      }
      continue;
    }

    const m = line.match(playerRe);
    if (m) {
      const num = parseInt(m[1]);
      if (num >= 1 && num <= 99) {
        players.push({
          shirtNumber: num,
          playerName: m[2].trim(),
          role,
        });
      }
    }
  }
  return players;
}

// ---------------------------------------------------------------------------
// Main parser — splits PDF items into two columns by X coordinate
// ---------------------------------------------------------------------------
function parseMatchSheet(items: TextItem[]): ParseResult {
  const midX = findMidX(items);

  const leftItems = items.filter((i) => i.x < midX);
  const rightItems = items.filter((i) => i.x >= midX);

  const leftLines = groupIntoLines(leftItems).map((l) => l.text);
  const rightLines = groupIntoLines(rightItems).map((l) => l.text);

  return {
    teamA: { label: "Time A (LOCAL)", players: parseColumn(leftLines) },
    teamB: { label: "Time B (VISITANTE)", players: parseColumn(rightLines) },
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  matchId: string;
  homeClubId: string;
  awayClubId: string;
  homeClubName: string;
  awayClubName: string;
}

type ImportStatus = "idle" | "loading" | "preview" | "importing" | "done" | "error";

export function MatchSheetImporter({
  matchId,
  homeClubId,
  awayClubId,
  homeClubName,
  awayClubName,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const { addRosterEntry, roster, removeRosterEntry } = useMatchStore();

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Selecione um arquivo PDF.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const items = await extractItems(file);
      if (items.length === 0) {
        setError("O PDF não contém texto extraível. Verifique se o arquivo não é uma imagem escaneada.");
        setStatus("error");
        return;
      }
      const result = parseMatchSheet(items);
      const total = result.teamA.players.length + result.teamB.players.length;
      if (total === 0) {
        setError(
          "Não foi possível extrair jogadores. Verifique se é o arquivo SAR 4N correto."
        );
        setStatus("error");
        return;
      }
      setParsed(result);
      setStatus("preview");
    } catch (e) {
      setError(`Erro ao ler PDF: ${e instanceof Error ? e.message : String(e)}`);
      setStatus("error");
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setStatus("importing");
    try {
      // Clear existing roster for this match
      const existing = roster.filter((r) => r.matchId === matchId);
      for (const r of existing) await removeRosterEntry(r.id);

      // Team A → homeClubId
      for (const p of parsed.teamA.players) {
        await addRosterEntry({
          matchId,
          clubId: homeClubId,
          playerName: p.playerName,
          shirtNumber: p.shirtNumber,
          role: p.role,
          staffRole: p.staffRole,
          active: p.role === "starter",
        });
      }

      // Team B → awayClubId
      for (const p of parsed.teamB.players) {
        await addRosterEntry({
          matchId,
          clubId: awayClubId,
          playerName: p.playerName,
          shirtNumber: p.shirtNumber,
          role: p.role,
          staffRole: p.staffRole,
          active: p.role === "starter",
        });
      }

      setStatus("done");
      toast.success(
        `Escalação importada: ${parsed.teamA.players.length} (${homeClubName}) + ${parsed.teamB.players.length} (${awayClubName})`
      );
    } catch (e) {
      setError(`Erro ao importar: ${e instanceof Error ? e.message : String(e)}`);
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setParsed(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <Upload className="w-4 h-4" />
        Importar Match Sheet (PDF SAR 4N)
      </div>

      {status === "idle" && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Selecionar PDF da planilha oficial
          </Button>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1 text-center">
            Formato: SAR 4N Team Match Sheet — substitui a escalação atual
          </p>
        </div>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Lendo PDF...
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === "preview" && parsed && (
        <div className="space-y-3">
          <div className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
            Pré-visualização — confirme antes de importar
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Team A */}
            <div className="border border-[var(--border)] rounded-md p-2 space-y-1 max-h-64 overflow-y-auto">
              <div className="text-xs font-bold text-[var(--foreground)] mb-1 sticky top-0 bg-[var(--card)]">
                {homeClubName}
              </div>
              {parsed.teamA.players.map((p, i) => (
                <div key={i} className="text-[10px] text-[var(--muted-foreground)] flex gap-1">
                  {p.role !== "staff" && (
                    <span className="font-mono w-5 shrink-0">#{p.shirtNumber}</span>
                  )}
                  <span className="truncate">{p.playerName}</span>
                  {p.staffRole && (
                    <span className="text-[9px] opacity-60 shrink-0">({p.staffRole})</span>
                  )}
                </div>
              ))}
            </div>
            {/* Team B */}
            <div className="border border-[var(--border)] rounded-md p-2 space-y-1 max-h-64 overflow-y-auto">
              <div className="text-xs font-bold text-[var(--foreground)] mb-1 sticky top-0 bg-[var(--card)]">
                {awayClubName}
              </div>
              {parsed.teamB.players.map((p, i) => (
                <div key={i} className="text-[10px] text-[var(--muted-foreground)] flex gap-1">
                  {p.role !== "staff" && (
                    <span className="font-mono w-5 shrink-0">#{p.shirtNumber}</span>
                  )}
                  <span className="truncate">{p.playerName}</span>
                  {p.staffRole && (
                    <span className="text-[9px] opacity-60 shrink-0">({p.staffRole})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleImport} className="flex-1">
              Confirmar Importação
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {status === "importing" && (
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Importando escalação...
        </div>
      )}

      {status === "done" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-md p-3">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Escalação importada com sucesso!
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            Importar outro PDF
          </Button>
        </div>
      )}
    </div>
  );
}
