import { supabase } from "@/integrations/supabase/client";

async function callProxy(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("benchmark-proxy", {
    body,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function fetchPBCompany(pbId: string, useSandbox: boolean) {
  return callProxy({ action: "pb_company", pbId, useSandbox });
}

export async function fetchPBDeals(pbId: string, useSandbox: boolean) {
  return callProxy({ action: "pb_deals", pbId, useSandbox });
}

export async function fetchPBDealDetails(dealId: string, useSandbox: boolean) {
  return callProxy({ action: "pb_deal_details", pbId: dealId, useSandbox });
}

export async function searchHarmonicByDomain(domain: string) {
  return callProxy({ action: "h_search", domain });
}

export async function fetchHarmonicCompany(harmonicId: string) {
  return callProxy({ action: "h_company", harmonicId });
}
