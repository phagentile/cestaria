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
// Render PDF page to canvas, return as ImageData URL
// ---------------------------------------------------------------------------
async function renderPageToCanvas(file: File, pageNum = 1): Promise<HTMLCanvasElement> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const page = await pdf.getPage(pageNum);
  const scale = 2.5; // higher = better OCR accuracy
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (page as any).render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas;
}

// ---------------------------------------------------------------------------
// OCR with Tesseract — returns lines with bounding box info
// ---------------------------------------------------------------------------
interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

async function ocrCanvas(
  canvas: HTMLCanvasElement,
  onProgress?: (pct: number) => void
): Promise<OcrWord[]> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng+spa+por", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const result = await worker.recognize(canvas);
  await worker.terminate();

  const words: OcrWord[] = [];
  for (const block of result.data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const word of line.words ?? []) {
          if (word.text.trim()) {
            words.push({
              text: word.text.trim(),
              x0: word.bbox.x0,
              y0: word.bbox.y0,
              x1: word.bbox.x1,
              y1: word.bbox.y1,
            });
          }
        }
      }
    }
  }
  return words;
}

// ---------------------------------------------------------------------------
// Group words into lines (by Y proximity) then into left/right columns
// ---------------------------------------------------------------------------
interface TextLine {
  y: number;
  text: string;
  minX: number;
}

function groupWordsIntoLines(words: OcrWord[], tolerance = 8): TextLine[] {
  const sorted = [...words].sort((a, b) => {
    const dy = a.y0 - b.y0;
    if (Math.abs(dy) > tolerance) return dy;
    return a.x0 - b.x0;
  });

  const lines: Array<{ y: number; words: OcrWord[] }> = [];
  for (const w of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(w.y0 - last.y) <= tolerance) {
      last.words.push(w);
    } else {
      lines.push({ y: w.y0, words: [w] });
    }
  }

  return lines.map((l) => ({
    y: l.y,
    text: l.words.map((w) => w.text).join(" "),
    minX: Math.min(...l.words.map((w) => w.x0)),
  }));
}

// ---------------------------------------------------------------------------
// Parse a column's lines into players
// ---------------------------------------------------------------------------
function parseColumn(lines: string[]): ParsedPlayer[] {
  const players: ParsedPlayer[] = [];
  let role: "starter" | "reserve" | "staff" = "starter";

  // Player: starts with 1–2 digit number then name
  const playerRe = /^(\d{1,2})[.\s]+(.{3,})$/;
  // Staff: "Name — ROLE" or "— Name — ROLE"
  const staffRe = /^[—\-]?\s*(.+?)\s+[—\-]+\s+(.+)$/;

  const SKIP = [
    "MATCH SHEET", "ÁRBITRO", "ARBITRO", "ASISTENTE", "PLANILLERO",
    "MEDICO", "MÉDICO", "LOCAL", "VISITANTE", "RESULTADO", "SUPER RUGBY",
    "PARTIDO", "FECHA", "LUGAR", "TMO", "COMMISSIONER", "JUDICIAL",
    "CITACI", "APELACI", "SAR", "AMERICAS", "TEAM A", "TEAM B",
    "© SAR", "UBICACI", "19:06", "NACIONAL",
  ];

  for (const raw of lines) {
    const line = raw.trim().replace(/\s+/g, " ");
    if (!line || line.length < 2) continue;
    const up = line.toUpperCase();

    if (SKIP.some((s) => up.includes(s))) continue;
    // Skip pure numbers (scores, partido number)
    if (/^\d+$/.test(line)) continue;

    if (up.includes("SUPLENTE") || up.includes("SUBSTITUTE")) {
      role = "reserve";
      continue;
    }
    if (up === "STAFF" || up.startsWith("STAFF ")) {
      role = "staff";
      continue;
    }

    if (role === "staff") {
      const m = line.match(staffRe);
      if (m) {
        players.push({
          shirtNumber: 0,
          playerName: m[1].replace(/^[—\-]\s*/, "").trim(),
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
// Main: split by column X midpoint and parse each side
// ---------------------------------------------------------------------------
function parseFromLines(lines: TextLine[], canvasWidth: number): ParseResult {
  const midX = canvasWidth / 2;

  const leftLines = lines.filter((l) => l.minX < midX).map((l) => l.text);
  const rightLines = lines.filter((l) => l.minX >= midX).map((l) => l.text);

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
  const [progress, setProgress] = useState(0);
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
    setProgress(0);
    setError("");
    try {
      // Render page 1 to canvas
      const canvas = await renderPageToCanvas(file, 1);

      // OCR
      const words = await ocrCanvas(canvas, setProgress);

      if (words.length === 0) {
        setError("OCR não encontrou texto na página. Verifique se o PDF tem boa resolução.");
        setStatus("error");
        return;
      }

      const lines = groupWordsIntoLines(words);
      const result = parseFromLines(lines, canvas.width);
      const total = result.teamA.players.length + result.teamB.players.length;

      if (total === 0) {
        setError("Jogadores não encontrados. Verifique se é o arquivo SAR 4N correto.");
        setStatus("error");
        return;
      }

      setParsed(result);
      setStatus("preview");
    } catch (e) {
      setError(`Erro: ${e instanceof Error ? e.message : String(e)}`);
      setStatus("error");
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setStatus("importing");
    try {
      const existing = roster.filter((r) => r.matchId === matchId);
      for (const r of existing) await removeRosterEntry(r.id);

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
    setProgress(0);
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
        <div className="space-y-2 py-2">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress === 0 ? "Renderizando PDF..." : `OCR em andamento — ${progress}%`}
          </div>
          {progress > 0 && (
            <div className="w-full bg-[var(--muted)] rounded-full h-1.5">
              <div
                className="bg-[var(--rugby-try)] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
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
