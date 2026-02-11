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
  return d.slice(0, 7); // "YYYY-MM"
}

function formatMonthLabel(key: string): string {
  if (key === "Unknown") return "Unknown Date";
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

interface MonthGroup {
  key: string;
  label: string;
  pb: (FundingRound & { normalizedDate: string })[];
  harmonic: (FundingRound & { normalizedDate: string })[];
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

function RoundRow({ round, logo, alt }: { round: FundingRound & { normalizedDate: string }; logo: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const hasInvestors = round.investors && round.investors.length > 0;

  return (
    <div>
      <button
        onClick={() => hasInvestors && setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors ${hasInvestors ? "hover:bg-muted/60 cursor-pointer" : "cursor-default"}`}
      >
        {hasInvestors ? (
          open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <img src={logo} alt={alt} className="h-3.5 w-3.5 shrink-0" />
        <span className="text-muted-foreground w-20 shrink-0">{round.normalizedDate}</span>
        <span className="flex-1 text-left">{alt === "Harmonic" ? normalizeType(round.type) : round.type || "—"}</span>
        <span className="text-right tabular-nums">{fmt(round.amount)}</span>
      </button>
      {open && hasInvestors && (
        <div className="ml-[4.5rem] px-3 pb-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Investors:</span>{" "}
          {round.investors.join(", ")}
        </div>
      )}
    </div>
  );
}

export default function ComparisonTable({ pbRounds, harmonicRounds }: Props) {
  const filteredHarmonic = harmonicRounds.filter(r => r.amount == null || r.amount > 0);
  const months = groupByMonth(pbRounds, filteredHarmonic);

  if (months.length === 0) return <p className="text-sm text-muted-foreground">No funding rounds found.</p>;

  return (
    <div className="space-y-1">
      {months.map((m) => (
        <div key={m.key} className="rounded-md border border-border overflow-hidden">
          <div className="bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide text-foreground/80 border-b border-border">
            {m.label}
          </div>
          <div className="divide-y divide-border/50">
            {m.pb.map((r, i) => (
              <RoundRow key={`pb-${i}`} round={r} logo={pbLogo} alt="PitchBook" />
            ))}
            {m.harmonic.map((r, i) => (
              <RoundRow key={`h-${i}`} round={r} logo={hLogo} alt="Harmonic" />
            ))}
            {m.pb.length === 0 && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground/50 italic flex items-center gap-2">
                <span className="w-3" /><img src={pbLogo} alt="" className="h-3.5 w-3.5 opacity-30" /> No PitchBook rounds
              </div>
            )}
            {m.harmonic.length === 0 && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground/50 italic flex items-center gap-2">
                <span className="w-3" /><img src={hLogo} alt="" className="h-3.5 w-3.5 opacity-30" /> No Harmonic rounds
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
