import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TMDB_READ_TOKEN = Deno.env.get('TMDB_READ_TOKEN');
    
    if (!TMDB_READ_TOKEN) {
      throw new Error('TMDB_READ_TOKEN not configured');
    }

    const { endpoint, params } = await req.json();
    
    const baseUrl = 'https://api.themoviedb.org/3';
    const queryParams = new URLSearchParams({
      language: 'pt-BR',
      ...params
    });
    
    const url = `${baseUrl}${endpoint}?${queryParams}`;
    
    console.log(`Fetching TMDB: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TMDB_READ_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMDB API error:', response.status, errorText);
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
