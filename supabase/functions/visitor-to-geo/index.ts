// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { Body, GeoData, GeoResponse } from "./types.ts";
import { Database } from "../_shared/types/supabase.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Hello from Functions!");

serve(async (req) => {
  // Handle CORs
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Get MMDB Server url
  const url = Deno.env.get("MMDB_URL");
  if (url == null) {
    throw new Error("MMDB url is missing!");
  }

  const { ip, domain } = await req.json() as Body;
  if (ip == null) {
    throw new Error("IP address is missing from the request body!");
  }
  if (domain == null) {
    throw new Error("Domain is missing from the request body!");
  }
  // Get geolocation data
  const response = await fetch(`${url}${ip}`);
  const geoData = await response.json() as GeoData;

  // Connect to Supabase
  const authHeader = req.headers.get("Authorization")!;
  const supabaseClient = createClient<Database>(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const {data, error} = await supabaseClient.from('domains').select('id').eq('domain', domain).single();
  if (error || data == null) {
    throw new Error(`Failed to get domain id from Supabase: ${error.message}`);
  }
  const subdivisions = geoData.subdivisions.map((x) => x.names.en);
  const { data: d2, error: err2 } = await supabaseClient.from('visitors').insert({
    domain_id: data.id,
    ip: ip,
    continent: geoData.continent.names.en,
    visited_at: new Date().toISOString(),
    country: geoData.country.names.en,
    country_iso: geoData.country.iso_code,
    is_eu: geoData.country.is_in_european_union,
    city: geoData.city.names.en,
    subdivisions: subdivisions,
  }).select().single();
  if (err2 || d2 == null) {
    throw new Error(`Failed to insert visitor record into Supabase: ${err2.message}`);
  }

  const success: GeoResponse = {
    visitor_id: d2.id,
    domain: domain,
    continent: geoData.continent.names.en,
    country: geoData.country.names.en,
    subdivisions: subdivisions
  }

  return new Response(JSON.stringify(success), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
