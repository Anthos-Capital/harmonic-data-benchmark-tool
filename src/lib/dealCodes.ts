/* eslint-disable @typescript-eslint/no-explicit-any */

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

/**
 * Extract a human-readable deal type from PB deal objects.
 * PB API returns dealType1/dealType2/dealType3 and dealClass as {code, description} objects.
 */
export function extractPBDealType(detail: any | null, listing: any): string {
  // Prefer dealType2 (Series A/B/C etc.) from detail or listing
  const dt2 = detail?.dealType2 ?? listing?.dealType2;
  if (dt2?.description) return dt2.description;

  // Fallback to dealType1 from listing (Grant, etc.)
  const dt1 = listing?.dealType1 ?? detail?.dealType1;
  if (dt1?.description) return dt1.description;

  // Fallback to dealClass from detail (Venture Capital, Corporate, etc.)
  const dc = detail?.dealClass ?? listing?.dealClass;
  if (dc?.description) return dc.description;

  // Legacy fallback for string dealType
  const legacy = detail?.dealType ?? listing?.dealType;
  if (legacy) return decodeDealType(String(legacy));

  return "";
}
