import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids?: number[];
  media_type?: string;
  popularity?: number;
  known_for?: TMDBItem[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TMDB_READ_TOKEN = Deno.env.get('TMDB_READ_TOKEN');
    if (!TMDB_READ_TOKEN) throw new Error('TMDB_READ_TOKEN not configured');

    const body = await req.json();
    const { endpoint, params, mode, query } = body ?? {};

    const call = async (path: string, extra: Record<string, string> = {}, language = 'pt-BR') => {
      const qs = new URLSearchParams({ language, ...extra });
      const url = `${BASE_URL}${path}?${qs}`;
      console.log(`Fetching TMDB: ${url}`);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TMDB_READ_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('TMDB API error:', res.status, errorText);
        throw new Error(`TMDB API error: ${res.status}`);
      }
      return res.json();
    };

    // ---- Smart cascade search used by the Ashley chat ----
    if (mode === 'smart_search') {
      const term = String(query ?? '').trim();
      if (!term) {
        return new Response(JSON.stringify({ results: [], suggestions: [], strategy: 'empty' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const viable = (item: TMDBItem) =>
        (item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type) &&
        Boolean(item.poster_path || item.backdrop_path);

      const rank = (items: TMDBItem[]) =>
        [...items].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

      // 1) multi search in Portuguese
      let strategy = 'multi_pt';
      let results = rank(((await call('/search/multi', { query: term, include_adult: 'false', page: '1' })).results ?? []).filter(viable));

      // 2) multi search in English
      if (!results.length) {
        strategy = 'multi_en';
        results = rank(
          ((await call('/search/multi', { query: term, include_adult: 'false', page: '1' }, 'en-US')).results ?? []).filter(viable)
        );
      }

      // 3) person search: user may have named an actor or director
      if (!results.length) {
        strategy = 'person';
        const people = ((await call('/search/person', { query: term, include_adult: 'false', page: '1' })).results ?? []) as TMDBItem[];
        const knownFor = people.flatMap((p) => p.known_for ?? []).filter(viable);
        results = rank(knownFor);
      }

      // 4) fuzzy fallback: use the longest word of the term
      if (!results.length) {
        const longest = term
          .split(/\s+/)
          .filter((w) => w.length >= 4)
          .sort((a, b) => b.length - a.length)[0];
        if (longest && longest.toLowerCase() !== term.toLowerCase()) {
          strategy = 'fuzzy_word';
          results = rank(
            ((await call('/search/multi', { query: longest, include_adult: 'false', page: '1' })).results ?? []).filter(viable)
          );
        }
      }

      // Suggestions so the chat never dead-ends on "not found"
      let suggestions: TMDBItem[] = [];
      if (!results.length) {
        strategy = `${strategy}_none`;
        suggestions = rank(((await call('/trending/all/week')).results ?? []).filter(viable)).slice(0, 3);
      }

      return new Response(
        JSON.stringify({ results: results.slice(0, 6), suggestions, strategy, query: term }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---- Passthrough mode (galleries, videos, discover) ----
    const data = await call(endpoint, params ?? {});

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
