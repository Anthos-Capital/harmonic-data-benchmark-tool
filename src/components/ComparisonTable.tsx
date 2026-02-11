import { useState, Fragment } from "react";
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

function InvestorExpander({ round }: { round: NormalizedRound }) {
  const [open, setOpen] = useState(false);
  const hasInvestors = round.investors && round.investors.length > 0;
  if (!hasInvestors) return <span className="w-4 inline-block" />;

  return (
    <>
      <button onClick={() => setOpen(!open)} className="inline-flex items-center hover:text-foreground transition-colors">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <tr>
          <td colSpan={7} className="px-6 py-1 text-xs text-muted-foreground border-b border-border/30">
            <span className="font-medium text-foreground/70">Investors:</span>{" "}
            {round.investors.join(", ")}
          </td>
        </tr>
      )}
    </>
  );
}

function RoundRow({ pb, harmonic }: { pb?: NormalizedRound; harmonic?: NormalizedRound }) {
  const [open, setOpen] = useState(false);
  const hasPbInvestors = pb?.investors && pb.investors.length > 0;
  const hasHInvestors = harmonic?.investors && harmonic.investors.length > 0;
  const expandable = hasPbInvestors || hasHInvestors;

  return (
    <>
      <tr
        className={`text-xs font-mono border-b border-border/30 ${expandable ? "cursor-pointer hover:bg-muted/40" : ""}`}
        onClick={() => expandable && setOpen(!open)}
      >
        {/* Expand icon */}
        <td className="pl-2 pr-0 py-1.5 text-muted-foreground">
          {expandable ? (
            open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : null}
        </td>
        {/* PB columns */}
        <td className="px-3 py-1.5 text-muted-foreground">{pb?.normalizedDate ?? "—"}</td>
        <td className="px-3 py-1.5 truncate">{pb?.type ?? "—"}</td>
        <td className="px-3 py-1.5 text-right tabular-nums border-r border-border">{fmt(pb?.amount ?? null)}</td>
        {/* Harmonic columns */}
        <td className="px-3 py-1.5 text-muted-foreground">{harmonic?.normalizedDate ?? "—"}</td>
        <td className="px-3 py-1.5 truncate">{harmonic?.type ? normalizeType(harmonic.type) : "—"}</td>
        <td className="px-3 py-1.5 text-right tabular-nums">{fmt(harmonic?.amount ?? null)}</td>
      </tr>
      {open && (hasPbInvestors || hasHInvestors) && (
        <tr className="text-xs border-b border-border/30 bg-muted/20">
          <td className="pl-2 pr-0 py-1" />
          <td colSpan={3} className="px-3 py-1.5 text-muted-foreground border-r border-border align-top">
            {hasPbInvestors ? (
              <><span className="font-medium text-foreground/70">Investors:</span> {pb!.investors.join(", ")}</>
            ) : <span className="text-muted-foreground/40 italic">No investor data</span>}
          </td>
          <td colSpan={3} className="px-3 py-1.5 text-muted-foreground align-top">
            {hasHInvestors ? (
              <><span className="font-medium text-foreground/70">Investors:</span> {harmonic!.investors.join(", ")}</>
            ) : <span className="text-muted-foreground/40 italic">No investor data</span>}
          </td>
        </tr>
      )}
    </>
  );
}

export default function ComparisonTable({ pbRounds, harmonicRounds }: Props) {
  const filteredHarmonic = harmonicRounds.filter(r => r.amount == null || r.amount > 0);
  const months = groupByMonth(pbRounds, filteredHarmonic);

  if (months.length === 0) return <p className="text-sm text-muted-foreground">No funding rounds found.</p>;

  return (
    <div className="rounded-md border border-border overflow-auto">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-5" />
          {/* PB: date, type, amount */}
          <col style={{ width: "5.5rem" }} />
          <col />
          <col style={{ width: "5rem" }} />
          {/* H: date, type, amount */}
          <col style={{ width: "5.5rem" }} />
          <col />
          <col style={{ width: "5rem" }} />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-background">
          {/* Source row */}
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th />
            <th colSpan={3} className="px-3 py-1.5 text-left border-r border-border">
              <span className="inline-flex items-center gap-1">
                <img src={pbLogo} alt="" className="h-3 w-3" /> PitchBook
              </span>
            </th>
            <th colSpan={3} className="px-3 py-1.5 text-left">
              <span className="inline-flex items-center gap-1">
                <img src={hLogo} alt="" className="h-3 w-3" /> Harmonic
              </span>
            </th>
          </tr>
          {/* Column headers */}
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th />
            <th className="px-3 py-1 text-left">Date</th>
            <th className="px-3 py-1 text-left">Type</th>
            <th className="px-3 py-1 text-right border-r border-border">Amount</th>
            <th className="px-3 py-1 text-left">Date</th>
            <th className="px-3 py-1 text-left">Type</th>
            <th className="px-3 py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => {
            const maxRows = Math.max(m.pb.length, m.harmonic.length, 1);
            return (
              <Fragment key={m.key}>
                {/* Month header */}
                <tr>
                  <td colSpan={7} className="bg-muted/50 px-3 py-1 text-xs font-semibold tracking-wide text-foreground/80 border-b border-t border-border">
                    {m.label}
                  </td>
                </tr>
                {Array.from({ length: maxRows }).map((_, i) => (
                  <RoundRow key={i} pb={m.pb[i]} harmonic={m.harmonic[i]} />
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


