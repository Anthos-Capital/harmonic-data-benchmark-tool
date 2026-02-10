import type { FundingRound } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  pbRounds: FundingRound[];
  harmonicRounds: FundingRound[];
}

function fmt(amount: number | null): string {
  if (amount == null) return "—";
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function matchRounds(pb: FundingRound[], h: FundingRound[]) {
  const used = new Set<number>();
  const rows: { pb?: FundingRound; h?: FundingRound }[] = [];

  for (const p of pb) {
    let best = -1;
    let bestDiff = Infinity;
    const pDate = new Date(p.date).getTime();
    h.forEach((hr, i) => {
      if (used.has(i)) return;
      const diff = Math.abs(new Date(hr.date).getTime() - pDate);
      if (diff < bestDiff && diff < 180 * 86400000) {
        bestDiff = diff;
        best = i;
      }
    });
    if (best >= 0) {
      used.add(best);
      rows.push({ pb: p, h: h[best] });
    } else {
      rows.push({ pb: p });
    }
  }
  h.forEach((hr, i) => {
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
  const rows = matchRounds(pbRounds, harmonicRounds);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No funding rounds found.</p>;

  return (
    <div className="rounded-md border border-border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="w-28">PB Date</TableHead>
            <TableHead>PB Type</TableHead>
            <TableHead className="text-right">PB Amount</TableHead>
            <TableHead className="w-28">H Date</TableHead>
            <TableHead>H Type</TableHead>
            <TableHead className="text-right">H Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i} className="font-mono text-xs">
              <TableCell>{r.pb?.date ?? "—"}</TableCell>
              <TableCell className={diffClass(r.pb?.type, r.h?.type)}>
                {r.pb?.type ?? "—"}
              </TableCell>
              <TableCell className={`text-right ${diffClass(r.pb?.amount, r.h?.amount)}`}>
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
