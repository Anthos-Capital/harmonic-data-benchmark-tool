export interface FundingRound {
  date: string;
  type: string;
  amount: number | null;
  currency: string;
  investors: string[];
  source: "pitchbook" | "harmonic";
}

export interface CompanyMeta {
  name: string;
  website?: string;
  description?: string;
  hq?: string;
  founded?: string;
}

export interface StatusMessage {
  step: string;
  status: "pending" | "loading" | "done" | "error";
  detail?: string;
}
