import type { FundingRound } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import pbLogo from "@/assets/pitchbook-logo.png";
import hLogo from "@/assets/harmonic-logo.png";

interface Props {
  pbRounds: FundingRound[];
  harmonicRounds: FundingRound[];
  /** Filter out Harmonic rounds with $0 amounts */
  filterZeroAmounts?: boolean;
}

function fmt(amount: number | null): string {
  if (amount == null) return "—";
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

/** Normalize any date string to YYYY-MM-DD */
function normalizeDate(raw: string): string {
  if (!raw) return "";
  // Handle ISO dates like "2025-03-31T00:00:00Z"
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return raw;
}

function matchRounds(pb: FundingRound[], h: FundingRound[]) {
  // Normalize all dates first
  const normPb = pb.map(r => ({ ...r, date: normalizeDate(r.date) }));
  const normH = h.map(r => ({ ...r, date: normalizeDate(r.date) }));

  const used = new Set<number>();
  const rows: { pb?: FundingRound; h?: FundingRound }[] = [];

  for (const p of normPb) {
    let best = -1;
    let bestDiff = Infinity;
    const pDate = new Date(p.date).getTime();
    normH.forEach((hr, i) => {
      if (used.has(i)) return;
      const diff = Math.abs(new Date(hr.date).getTime() - pDate);
      if (diff < bestDiff && diff < 180 * 86400000) {
        bestDiff = diff;
        best = i;
      }
    });
    if (best >= 0) {
      used.add(best);
      rows.push({ pb: p, h: normH[best] });
    } else {
      rows.push({ pb: p });
    }
  }
  normH.forEach((hr, i) => {
    if (!used.has(i)) rows.push({ h: hr });
  });

  return rows.sort((a, b) => {
    const da = new Date(a.pb?.date || a.h?.date || 0).getTime();
    const db = new Date(b.pb?.date || b.h?.date || 0).getTime();
    return db - da;
  });
}

function diffClass(a?: string | number | null, b?: string | number | null) {
  if (a == null || b == null) return "";
  return String(a) !== String(b) ? "text-yellow-400" : "";
}

export default function ComparisonTable({ pbRounds, harmonicRounds }: Props) {
  // Filter out Harmonic rounds with $0 amounts
  const filteredHarmonic = harmonicRounds.filter(r => r.amount == null || r.amount > 0);
  const rows = matchRounds(pbRounds, filteredHarmonic);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No funding rounds found.</p>;

  return (
    <div className="rounded-md border border-border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead colSpan={3} className="border-r border-border">
              <span className="inline-flex items-center gap-1.5">
                <img src={pbLogo} alt="PitchBook" className="h-4 w-4" />
                PitchBook
              </span>
            </TableHead>
            <TableHead colSpan={3}>
              <span className="inline-flex items-center gap-1.5">
                <img src={hLogo} alt="Harmonic" className="h-4 w-4" />
                Harmonic
              </span>
            </TableHead>
          </TableRow>
          <TableRow className="text-xs">
            <TableHead className="w-28">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right border-r border-border">Amount</TableHead>
            <TableHead className="w-28">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i} className="font-mono text-xs">
              <TableCell>{r.pb?.date ?? "—"}</TableCell>
              <TableCell className={diffClass(r.pb?.type, r.h?.type)}>
                {r.pb?.type ?? "—"}
              </TableCell>
              <TableCell className={`text-right border-r border-border ${diffClass(r.pb?.amount, r.h?.amount)}`}>
                {fmt(r.pb?.amount ?? null)}
              </TableCell>
              <TableCell>{r.h?.date ?? "—"}</TableCell>
              <TableCell className={diffClass(r.pb?.type, r.h?.type)}>
                {r.h?.type ?? "—"}
              </TableCell>
              <TableCell className={`text-right ${diffClass(r.pb?.amount, r.h?.amount)}`}>
                {fmt(r.h?.amount ?? null)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
