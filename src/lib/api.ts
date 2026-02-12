import { supabase } from "@/integrations/supabase/client";

export function getStoredPassword(): string | null {
  return sessionStorage.getItem("app_password");
}

async function callProxy(body: Record<string, unknown>) {
  const password = getStoredPassword();
  const { data, error } = await supabase.functions.invoke("benchmark-proxy", {
    body,
    headers: password ? { "x-app-password": password } : {},
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

export async function fetchPBCredits() {
  return callProxy({ action: "pb_credits", useSandbox: false });
}

export async function searchHarmonicByDomain(domain: string) {
  return callProxy({ action: "h_search", domain });
}

export async function fetchHarmonicCompany(harmonicId: string) {
  return callProxy({ action: "h_company", harmonicId });
}

export async function verifyPassword(): Promise<boolean> {
  try {
    const result = await callProxy({ action: "verify_password" });
    return result?.ok === true;
  } catch {
    return false;
  }
}
