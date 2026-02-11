import { useState, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import StatusBar from "@/components/StatusBar";
import CompanyHeader from "@/components/CompanyHeader";
import ComparisonTable from "@/components/ComparisonTable";
import type { FundingRound, CompanyMeta, StatusMessage } from "@/lib/types";
import { decodeDealType } from "@/lib/dealCodes";
import {
  fetchPBCompany,
  fetchPBDeals,
  fetchPBDealDetails,
  searchHarmonicByDomain,
  fetchHarmonicCompany,
} from "@/lib/api";

export default function Index() {
  const [steps, setSteps] = useState<StatusMessage[]>([]);
  const [pbMeta, setPbMeta] = useState<CompanyMeta>();
  const [hMeta, setHMeta] = useState<CompanyMeta>();
  const [currentPbId, setCurrentPbId] = useState<string>();
  const [currentHId, setCurrentHId] = useState<string>();
  const [pbRounds, setPbRounds] = useState<FundingRound[]>([]);
  const [hRounds, setHRounds] = useState<FundingRound[]>([]);
  const [loading, setLoading] = useState(false);

  const updateStep = (step: string, status: StatusMessage["status"], detail?: string) =>
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.step === step);
      const updated = { step, status, detail };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });

  const run = useCallback(async (pbId: string, useSandbox: boolean) => {
    setLoading(true);
    setSteps([]);
    setPbMeta(undefined);
    setHMeta(undefined);
    setCurrentPbId(pbId);
    setCurrentHId(undefined);
    setPbRounds([]);
    setHRounds([]);

    try {
      // 1. PB Company
      updateStep("PB Company", "loading");
      const company = await fetchPBCompany(pbId, useSandbox);
      const meta: CompanyMeta = {
        name: (typeof company.companyName === "object" ? company.companyName?.formalName : company.companyName) ?? company.name ?? pbId,
        website: company.website,
        description: company.description,
        hq: [company.city, company.state, company.country].filter(Boolean).join(", "),
        founded: company.yearFounded,
      };
      setPbMeta(meta);
      updateStep("PB Company", "done");

      // 2. PB Deals
      updateStep("PB Deals", "loading");
      const dealsRes = await fetchPBDeals(pbId, useSandbox);
      const dealItems = dealsRes.items ?? dealsRes ?? [];
      const pbFunding: FundingRound[] = [];
      for (const d of dealItems) {
        try {
          const detail = await fetchPBDealDetails(d.dealId, useSandbox);
          pbFunding.push({
            date: detail.dealDate ?? d.dealDate ?? "",
            type: decodeDealType(detail.dealType ?? d.dealType ?? ""),
            amount: (typeof (detail.dealSize ?? d.dealSize) === "object" ? (detail.dealSize ?? d.dealSize)?.amount : (detail.dealSize ?? d.dealSize)) ?? null,
            currency: "USD",
            investors: (detail.investors ?? []).map((inv: { investorName: string }) => inv.investorName),
            source: "pitchbook",
          });
        } catch {
          pbFunding.push({
            date: d.dealDate ?? "",
            type: decodeDealType(d.dealType ?? ""),
            amount: (typeof d.dealSize === "object" ? d.dealSize?.amount : d.dealSize) ?? null,
            currency: "USD",
            investors: [],
            source: "pitchbook",
          });
        }
      }
      setPbRounds(pbFunding);
      updateStep("PB Deals", "done", `${pbFunding.length} rounds`);

      // 3. Harmonic lookup
      if (meta.website) {
        updateStep("Harmonic Search", "loading");
        try {
          const domain = meta.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
          const searchRes = await searchHarmonicByDomain(domain);
          const results = searchRes.results ?? searchRes.data ?? [];
          if (results.length > 0) {
            const hId = results[0].id ?? results[0].entity_id;
            setCurrentHId(String(hId));
            updateStep("Harmonic Search", "done");
            updateStep("Harmonic Company", "loading");
            const hCompany = await fetchHarmonicCompany(String(hId));
            const foundedRaw = hCompany.founding_date?.date ?? hCompany.founded_date ?? hCompany.year_founded;
            const foundedStr = foundedRaw ? (typeof foundedRaw === "string" && foundedRaw.length > 4 ? new Date(foundedRaw).getFullYear().toString() : String(foundedRaw)) : undefined;
            const hCompanyMeta: CompanyMeta = {
              name: hCompany.name ?? "",
              website: hCompany.website?.url ?? hCompany.website_url ?? hCompany.domain,
              description: hCompany.description,
              hq: [hCompany.location?.city, hCompany.location?.state, hCompany.location?.country].filter(Boolean).join(", ") || hCompany.location_str,
              founded: foundedStr,
            };
            setHMeta(hCompanyMeta);
            const fundingRoundsArr = hCompany.funding_rounds ?? hCompany.fundings ?? [];
            let harmonicRounds: FundingRound[] = [];

            if (fundingRoundsArr.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              harmonicRounds = fundingRoundsArr.map((f: any) => ({
                date: (f.announcement_date ?? f.announced_date ?? f.date ?? "") as string,
                type: (f.funding_round_type ?? f.funding_type ?? f.series ?? "") as string,
                amount: (f.funding_amount ?? f.money_raised?.amount ?? f.amount ?? null) as number | null,
                currency: (f.funding_currency ?? "USD") as string,
                investors: ((f.investors ?? []) as Array<Record<string, string>>).map(
                  (inv) => inv.investor_name ?? inv.name ?? ""
                ),
                source: "harmonic" as const,
              }));
            } else if (hCompany.funding && hCompany.funding.num_funding_rounds > 0) {
              // Fallback: construct round(s) from the funding summary object
              harmonicRounds = [{
                date: hCompany.funding.last_funding_at ?? "",
                type: hCompany.funding.last_funding_type ?? "",
                amount: hCompany.funding.last_funding_total ?? hCompany.funding.funding_total ?? null,
                currency: "USD",
                investors: (hCompany.funding.investors ?? []).map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (inv: any) => inv.name ?? ""
                ),
                source: "harmonic" as const,
              }];
            }
            setHRounds(harmonicRounds);
            updateStep("Harmonic Company", "done", `${harmonicRounds.length} rounds`);
          } else {
            updateStep("Harmonic Search", "done", "no match");
          }
        } catch (e) {
          updateStep("Harmonic Search", "error", e instanceof Error ? e.message : "failed");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      updateStep("Error", "error", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6 font-mono">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Data Benchmark Tool</h1>
        <p className="text-sm text-muted-foreground">Compare PitchBook & Harmonic funding data</p>
      </header>

      <SearchBar onSearch={run} loading={loading} />
      <StatusBar steps={steps} />
      <CompanyHeader pb={pbMeta} harmonic={hMeta} pbId={currentPbId} harmonicId={currentHId} />
      {(pbRounds.length > 0 || hRounds.length > 0) && (
        <ComparisonTable pbRounds={pbRounds} harmonicRounds={hRounds} />
      )}
    </div>
  );
}
