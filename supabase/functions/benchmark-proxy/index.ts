import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PB_BASE = "https://api.pitchbook.com";
const HARMONIC_BASE = "https://api.harmonic.ai";

function pbHeaders(apiKey: string) {
  return {
    Authorization: `PB-Token ${apiKey}`,
    Accept: "application/json",
  };
}

function harmonicHeaders(apiKey: string) {
  return {
    apikey: apiKey,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function fetchJSON(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  const body = await res.text();
  if (!res.ok) throw new Error(`[${res.status}]: ${body}`);
  return JSON.parse(body);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, pbId, domain, harmonicId, useSandbox } = await req.json();

    // PitchBook actions
    if (action.startsWith("pb_")) {
      const apiKey = useSandbox
        ? Deno.env.get("PITCHBOOK_API_KEY_SANDBOX")
        : Deno.env.get("PITCHBOOK_API_KEY_LIVE");
      if (!apiKey) throw new Error("PitchBook API key not configured");

      let data: unknown;
      switch (action) {
        case "pb_company": {
          data = await fetchJSON(`${PB_BASE}/companies/${pbId}/bio`, pbHeaders(apiKey));
          break;
        }
        case "pb_deals": {
          data = await fetchJSON(`${PB_BASE}/companies/${pbId}/deals`, pbHeaders(apiKey));
          break;
        }
        case "pb_deal_details": {
          // pbId here is the dealId
          data = await fetchJSON(`${PB_BASE}/deals/${pbId}/detailed`, pbHeaders(apiKey));
          break;
        }
        default:
          throw new Error(`Unknown PB action: ${action}`);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Harmonic actions
    if (action.startsWith("h_")) {
      const apiKey = Deno.env.get("HARMONIC_API_KEY");
      if (!apiKey) throw new Error("Harmonic API key not configured");

      let data: unknown;
      switch (action) {
        case "h_search": {
          const url = `${HARMONIC_BASE}/companies?website_domain=${encodeURIComponent(domain)}`;
          const res = await fetch(url, {
            method: "POST",
            headers: harmonicHeaders(apiKey),
          });
          const body = await res.text();
          if (!res.ok) throw new Error(`Harmonic search failed [${res.status}]: ${body}`);
          // The response is the company object directly
          data = { results: [JSON.parse(body)] };
          break;
        }
        case "h_company": {
          data = await fetchJSON(
            `${HARMONIC_BASE}/companies/${harmonicId}`,
            harmonicHeaders(apiKey)
          );
          // Log funding-related keys for debugging
          const d = data as Record<string, unknown>;
          const fundingKeys = Object.keys(d).filter(k => k.toLowerCase().includes("fund"));
          console.log("Harmonic company keys with 'fund':", fundingKeys);
          console.log("funding_rounds length:", Array.isArray(d.funding_rounds) ? (d.funding_rounds as unknown[]).length : "not array");
          console.log("funding length:", Array.isArray(d.funding) ? (d.funding as unknown[]).length : "not array");
          console.log("fundings length:", Array.isArray(d.fundings) ? (d.fundings as unknown[]).length : "not array");
          break;
        }
        default:
          throw new Error(`Unknown Harmonic action: ${action}`);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("benchmark-proxy error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
