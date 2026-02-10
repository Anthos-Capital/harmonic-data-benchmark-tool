const dealTypeMap: Record<string, string> = {
  ACC: "Accelerator/Incubator",
  ANG: "Angel",
  BSO: "Business Spin-Off/Split-Off",
  CFD: "Crowdfunding",
  ELG: "Early Stage VC (Series A/B)",
  GPC: "Growth/Private Equity",
  ICO: "Initial Coin Offering",
  IPO: "IPO",
  LBO: "Leveraged Buyout",
  LSG: "Late Stage VC (Series C+)",
  MBO: "Management Buyout",
  MRG: "Merger/Acquisition",
  PIP: "PIPE",
  REV: "Revenue Loan",
  SCD: "Secondary Transaction",
  SDD: "Seed Round",
  SPB: "SPAC/Blank Check",
  VTD: "Venture Debt",
  VNT: "Venture (General)",
};

export function decodeDealType(code: string): string {
  return dealTypeMap[code?.toUpperCase()] ?? code;
}
