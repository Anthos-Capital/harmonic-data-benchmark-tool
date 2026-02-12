import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PB_BASE = "https://api.pitchbook.com";
const HARMONIC_BASE = "https://api.harmonic.ai";

const VALID_ACTIONS = new Set([
  "pb_company", "pb_deals", "pb_deal_details", "pb_credits",
  "h_search", "h_company",
]);

function validateString(val: unknown, name: string, maxLen = 500): string {
  if (typeof val !== "string" || val.length === 0 || val.length > maxLen) {
    throw new Error(`Invalid ${name}`);
  }
  return val.trim();
}

function validateDomain(val: unknown): string {
  const s = validateString(val, "domain", 253);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s)) {
    throw new Error("Invalid domain format");
  }
  return s;
}

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
  if (!res.ok) {
    console.error(`API error [${res.status}]: ${body}`);
    throw new Error("External API request failed");
  }
  return JSON.parse(body);
}

function errorResponse(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Unauthorized", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return errorResponse("Unauthorized", 401);
    }

    // Parse and validate input
    const body = await req.json();
    const action = validateString(body.action, "action", 50);
    if (!VALID_ACTIONS.has(action)) {
      return errorResponse("Invalid action", 400);
    }

    const useSandbox = body.useSandbox === true;

    // PitchBook actions
    if (action.startsWith("pb_")) {
      const apiKey = useSandbox
        ? Deno.env.get("PITCHBOOK_API_KEY_SANDBOX")
        : Deno.env.get("PITCHBOOK_API_KEY_LIVE");
      if (!apiKey) return errorResponse("API key not configured", 500);

      const pbId = action !== "pb_credits" ? validateString(body.pbId, "pbId", 100) : "";

      let data: unknown;
      switch (action) {
        case "pb_company": {
          data = await fetchJSON(`${PB_BASE}/companies/${encodeURIComponent(pbId)}/bio`, pbHeaders(apiKey));
          break;
        }
        case "pb_deals": {
          data = await fetchJSON(`${PB_BASE}/companies/${encodeURIComponent(pbId)}/deals`, pbHeaders(apiKey));
          break;
        }
        case "pb_deal_details": {
          data = await fetchJSON(`${PB_BASE}/deals/${encodeURIComponent(pbId)}/detailed`, pbHeaders(apiKey));
          break;
        }
        case "pb_credits": {
          data = await fetchJSON(`${PB_BASE}/credits/history`, pbHeaders(apiKey));
          break;
        }
        default:
          return errorResponse("Invalid action", 400);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Harmonic actions
    if (action.startsWith("h_")) {
      const apiKey = Deno.env.get("HARMONIC_API_KEY");
      if (!apiKey) return errorResponse("API key not configured", 500);

      let data: unknown;
      switch (action) {
        case "h_search": {
          const domain = validateDomain(body.domain);
          const url = `${HARMONIC_BASE}/companies?website_domain=${encodeURIComponent(domain)}`;
          const res = await fetch(url, {
            method: "POST",
            headers: harmonicHeaders(apiKey),
          });
          const responseBody = await res.text();
          if (!res.ok) {
            console.error(`Harmonic search error [${res.status}]: ${responseBody}`);
            throw new Error("Search request failed");
          }
          data = { results: [JSON.parse(responseBody)] };
          break;
        }
        case "h_company": {
          const harmonicId = validateString(body.harmonicId, "harmonicId", 100);
          data = await fetchJSON(
            `${HARMONIC_BASE}/companies/${encodeURIComponent(harmonicId)}`,
            harmonicHeaders(apiKey)
          );
          break;
        }
        default:
          return errorResponse("Invalid action", 400);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return errorResponse("Invalid action", 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("benchmark-proxy error:", msg);
    // Return generic error to client
    const safeMessages = ["Invalid action", "Invalid domain format", "Search request failed", "External API request failed", "Unauthorized"];
    const clientMsg = safeMessages.includes(msg) ? msg : "An unexpected error occurred";
    return errorResponse(clientMsg);
  }
});
