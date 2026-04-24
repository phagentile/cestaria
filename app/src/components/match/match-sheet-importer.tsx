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
  label: string; // raw team name from PDF
  players: ParsedPlayer[];
}

interface ParseResult {
  teamA: ParsedTeam;
  teamB: ParsedTeam;
}

// ---------------------------------------------------------------------------
// PDF text extraction (client-side via pdfjs-dist)
// ---------------------------------------------------------------------------
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    fullText += lines + "\n";
  }
  return fullText;
}

// ---------------------------------------------------------------------------
// Parser — reads the SAR 4N "team match sheet" format
// The PDF has two columns (Team A left, Team B right). pdfjs flattens them
// into a single text stream, so we parse by scanning for number + name pairs.
//
// Pattern observed in PDF:
//   "1 Brendon Alves Pinheiro ... 1 Juan Francisco Aguirre Gallardo"
//   "SUPLENTES" separates starters from reserves
//   "STAFF" separates reserves from staff
//   Staff lines: "Joshua Reeves — HEAD COACH"
// ---------------------------------------------------------------------------
function parseMatchSheet(raw: string): ParseResult {
  // Normalize: collapse multiple spaces, trim lines
  const text = raw.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // We'll collect all numbered player tokens and staff tokens in order,
  // then split them between the two teams.
  const players: ParsedPlayer[] = [];
  let currentRole: "starter" | "reserve" | "staff" = "starter";
  let staffRoleBuffer = "";

  // Regex: line starts with a number (1-99) then the player name
  const playerLine = /^(\d{1,2})\s+(.+)$/;
  // Staff line: "Name — ROLE" or "— Name — ROLE"
  const staffLine = /^—\s+(.+?)\s+[—–-]+\s+(.+)$/;
  const staffLine2 = /^(.+?)\s+[—–-]+\s+(.+)$/;

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes("SUPLENTES") || upper.includes("SUBSTITUTES") || upper.includes("RESERVES")) {
      currentRole = "reserve";
      continue;
    }
    if (upper === "STAFF") {
      currentRole = "staff";
      continue;
    }
    // Skip header rows
    if (
      upper.includes("MATCH SHEET") ||
      upper.includes("ÁRBITRO") ||
      upper.includes("ASISTENTE") ||
      upper.includes("PLANILLERO") ||
      upper.includes("MÉDICO") ||
      upper.includes("TEAM A") ||
      upper.includes("TEAM B") ||
      upper.includes("LOCAL") ||
      upper.includes("VISITANTE") ||
      upper.includes("RESULTADO") ||
      upper.includes("SAR") ||
      upper.includes("PARTIDO") ||
      upper.includes("SUPER RUGBY") ||
      upper.includes("FECHA") ||
      upper.includes("LUGAR") ||
      upper.includes("TMO") ||
      upper.includes("COMMISSIONER") ||
      upper.includes("JUDICIAL") ||
      upper.includes("CITACI") ||
      upper.includes("APELACI")
    ) {
      continue;
    }

    if (currentRole === "staff") {
      // Try to parse "— Name — ROLE" or "Name — ROLE"
      const m1 = line.match(staffLine);
      const m2 = m1 ? null : line.match(staffLine2);
      if (m1) {
        players.push({ shirtNumber: 0, playerName: m1[1].trim(), role: "staff", staffRole: m1[2].trim() });
      } else if (m2) {
        players.push({ shirtNumber: 0, playerName: m2[1].trim(), role: "staff", staffRole: m2[2].trim() });
      }
      staffRoleBuffer = "";
      continue;
    }

    const m = line.match(playerLine);
    if (m) {
      const num = parseInt(m[1]);
      if (num >= 1 && num <= 99) {
        players.push({ shirtNumber: num, playerName: m[2].trim(), role: currentRole });
      }
    }
  }

  // Split players into two teams by detecting duplicate shirt numbers:
  // Team A are the first occurrence of each number, Team B the second.
  // Staff entries (shirtNumber === 0) are distributed: first half to A, second to B.
  const teamAPlayers: ParsedPlayer[] = [];
  const teamBPlayers: ParsedPlayer[] = [];
  const seenNumbers = new Set<number>();
  let staffCount = 0;

  // Count total staff to split evenly
  const allStaff = players.filter((p) => p.role === "staff");
  const halfStaff = Math.ceil(allStaff.length / 2);
  let staffIdx = 0;

  for (const p of players) {
    if (p.role === "staff") {
      if (staffIdx < halfStaff) teamAPlayers.push(p);
      else teamBPlayers.push(p);
      staffIdx++;
      continue;
    }
    if (!seenNumbers.has(p.shirtNumber)) {
      seenNumbers.add(p.shirtNumber);
      teamAPlayers.push(p);
    } else {
      teamBPlayers.push(p);
    }
  }

  // Suppress unused warning
  void staffCount;

  return {
    teamA: { label: "Time A (LOCAL)", players: teamAPlayers },
    teamB: { label: "Time B (VISITANTE)", players: teamBPlayers },
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

export function MatchSheetImporter({ matchId, homeClubId, awayClubId, homeClubName, awayClubName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const { addRosterEntry, roster, removeRosterEntry } = useMatchStore();

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      setError("Selecione um arquivo PDF.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const text = await extractPdfText(file);
      const result = parseMatchSheet(text);
      if (result.teamA.players.length === 0 && result.teamB.players.length === 0) {
        setError("Não foi possível extrair jogadores do PDF. Verifique se é o arquivo correto.");
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
      // Clear existing roster entries for this match
      const existing = roster.filter((r) => r.matchId === matchId);
      for (const r of existing) await removeRosterEntry(r.id);

      // Import Team A → homeClubId
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

      // Import Team B → awayClubId
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
      toast.success(`Escalação importada: ${parsed.teamA.players.length} atletas (${homeClubName}) + ${parsed.teamB.players.length} (${awayClubName})`);
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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
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
          <Button variant="outline" size="sm" onClick={reset}>Tentar novamente</Button>
        </div>
      )}

      {status === "preview" && parsed && (
        <div className="space-y-3">
          <div className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
            Pré-visualização — confirme antes de importar
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Team A */}
            <div className="border border-[var(--border)] rounded-md p-2 space-y-1">
              <div className="text-xs font-bold text-[var(--foreground)] mb-1">{homeClubName}</div>
              {parsed.teamA.players.map((p, i) => (
                <div key={i} className="text-[10px] text-[var(--muted-foreground)] flex gap-1">
                  {p.role !== "staff" && <span className="font-mono w-5 shrink-0">#{p.shirtNumber}</span>}
                  <span className="truncate">{p.playerName}</span>
                  {p.staffRole && <span className="text-[9px] opacity-60 shrink-0">({p.staffRole})</span>}
                </div>
              ))}
            </div>
            {/* Team B */}
            <div className="border border-[var(--border)] rounded-md p-2 space-y-1">
              <div className="text-xs font-bold text-[var(--foreground)] mb-1">{awayClubName}</div>
              {parsed.teamB.players.map((p, i) => (
                <div key={i} className="text-[10px] text-[var(--muted-foreground)] flex gap-1">
                  {p.role !== "staff" && <span className="font-mono w-5 shrink-0">#{p.shirtNumber}</span>}
                  <span className="truncate">{p.playerName}</span>
                  {p.staffRole && <span className="text-[9px] opacity-60 shrink-0">({p.staffRole})</span>}
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
          <Button variant="outline" size="sm" onClick={reset}>Importar outro PDF</Button>
        </div>
      )}
    </div>
  );
}
