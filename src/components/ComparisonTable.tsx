import { useState } from "react";
import type { FundingRound } from "@/lib/types";
import pbLogo from "@/assets/pitchbook-logo.png";
import hLogo from "@/assets/harmonic-logo.png";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  pbRounds: FundingRound[];
  harmonicRounds: FundingRound[];
  filterZeroAmounts?: boolean;
}

function fmt(amount: number | null): string {
  if (amount == null) return "—";
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function normalizeDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return raw;
}

function normalizeType(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getMonthKey(dateStr: string): string {
  const d = normalizeDate(dateStr);
  if (!d) return "Unknown";
  return d.slice(0, 7);
}

function formatMonthLabel(key: string): string {
  if (key === "Unknown") return "Unknown Date";
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

type NormalizedRound = FundingRound & { normalizedDate: string };

interface MonthGroup {
  key: string;
  label: string;
  pb: NormalizedRound[];
  harmonic: NormalizedRound[];
}

function groupByMonth(pbRounds: FundingRound[], hRounds: FundingRound[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();

  for (const r of pbRounds) {
    const k = getMonthKey(r.date);
    if (!map.has(k)) map.set(k, { key: k, label: formatMonthLabel(k), pb: [], harmonic: [] });
    map.get(k)!.pb.push({ ...r, normalizedDate: normalizeDate(r.date) });
  }
  for (const r of hRounds) {
    const k = getMonthKey(r.date);
    if (!map.has(k)) map.set(k, { key: k, label: formatMonthLabel(k), pb: [], harmonic: [] });
    map.get(k)!.harmonic.push({ ...r, normalizedDate: normalizeDate(r.date) });
  }

  return Array.from(map.values()).sort((a, b) => (b.key > a.key ? 1 : -1));
}

function RoundCell({ round, isHarmonic }: { round?: NormalizedRound; isHarmonic?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!round) return <td className="px-3 py-1.5 text-xs text-muted-foreground/40 italic align-top">—</td>;

  const hasInvestors = round.investors && round.investors.length > 0;
  const type = isHarmonic ? normalizeType(round.type) : round.type;

  return (
    <td className="px-3 py-1.5 align-top">
      <button
        onClick={() => hasInvestors && setOpen(!open)}
        className={`w-full flex items-center gap-2 text-xs font-mono rounded transition-colors ${hasInvestors ? "hover:bg-muted/60 cursor-pointer" : "cursor-default"}`}
      >
        {hasInvestors ? (
          open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="text-muted-foreground w-20 shrink-0 text-left">{round.normalizedDate}</span>
        <span className="flex-1 text-left">{type || "—"}</span>
        <span className="text-right tabular-nums">{fmt(round.amount)}</span>
      </button>
      {open && hasInvestors && (
        <div className="ml-5 mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Investors:</span>{" "}
          {round.investors.join(", ")}
        </div>
      )}
    </td>
  );
}

export default function ComparisonTable({ pbRounds, harmonicRounds }: Props) {
  const filteredHarmonic = harmonicRounds.filter(r => r.amount == null || r.amount > 0);
  const months = groupByMonth(pbRounds, filteredHarmonic);

  if (months.length === 0) return <p className="text-sm text-muted-foreground">No funding rounds found.</p>;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border flex text-[10px] uppercase tracking-wider text-muted-foreground">
        <div className="w-1/2 px-3 py-1.5 border-r border-border/50">
          <span className="inline-flex items-center gap-1">
            <img src={pbLogo} alt="" className="h-3 w-3" /> PitchBook
          </span>
        </div>
        <div className="w-1/2 px-3 py-1.5">
          <span className="inline-flex items-center gap-1">
            <img src={hLogo} alt="" className="h-3 w-3" /> Harmonic
          </span>
        </div>
      </div>

      {/* Month groups */}
      {months.map((m) => {
        const maxRows = Math.max(m.pb.length, m.harmonic.length, 1);
        return (
          <div key={m.key}>
            <div className="bg-muted/50 px-3 py-1 text-xs font-semibold tracking-wide text-foreground/80 border-b border-t border-border">
              {m.label}
            </div>
            <table className="w-full">
              <tbody>
                {Array.from({ length: maxRows }).map((_, i) => (
                  <tr key={i} className={i < maxRows - 1 ? "border-b border-border/30" : ""}>
                    <RoundCell round={m.pb[i]} />
                    <RoundCell round={m.harmonic[i]} isHarmonic />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
