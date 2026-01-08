import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: string;
}

export interface TMDBResponse {
  results: TMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const getTMDBImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500') => {
  if (!path) return '/placeholder.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('tmdb', {
    body: { endpoint, params }
  });

  if (error) {
    console.error('TMDB fetch error:', error);
    throw new Error(error.message || 'Failed to fetch from TMDB');
  }

  return data as T;
}

export function useTrendingMovies() {
  return useQuery({
    queryKey: ['tmdb', 'trending', 'movie'],
    queryFn: () => fetchTMDB<TMDBResponse>('/trending/movie/week'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useTrendingSeries() {
  return useQuery({
    queryKey: ['tmdb', 'trending', 'tv'],
    queryFn: () => fetchTMDB<TMDBResponse>('/trending/tv/week'),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePopularMovies() {
  return useQuery({
    queryKey: ['tmdb', 'movie', 'popular'],
    queryFn: () => fetchTMDB<TMDBResponse>('/movie/popular'),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTopRatedMovies() {
  return useQuery({
    queryKey: ['tmdb', 'movie', 'top_rated'],
    queryFn: () => fetchTMDB<TMDBResponse>('/movie/top_rated'),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePopularSeries() {
  return useQuery({
    queryKey: ['tmdb', 'tv', 'popular'],
    queryFn: () => fetchTMDB<TMDBResponse>('/tv/popular'),
    staleTime: 1000 * 60 * 10,
  });
}

export function useActionMovies() {
  return useQuery({
    queryKey: ['tmdb', 'movie', 'action'],
    queryFn: () => fetchTMDB<TMDBResponse>('/discover/movie', { with_genres: '28' }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useKoreanDramas() {
  return useQuery({
    queryKey: ['tmdb', 'tv', 'korean'],
    queryFn: () => fetchTMDB<TMDBResponse>('/discover/tv', { 
      with_origin_country: 'KR',
      sort_by: 'popularity.desc'
    }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useRomanceMovies() {
  return useQuery({
    queryKey: ['tmdb', 'movie', 'romance'],
    queryFn: () => fetchTMDB<TMDBResponse>('/discover/movie', { with_genres: '10749' }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useMovieVideos(movieId: number | null) {
  return useQuery({
    queryKey: ['tmdb', 'movie', movieId, 'videos'],
    queryFn: () => fetchTMDB<{ results: Array<{ key: string; type: string; site: string }> }>(`/movie/${movieId}/videos`),
    enabled: !!movieId,
  });
}

export function useTVVideos(tvId: number | null) {
  return useQuery({
    queryKey: ['tmdb', 'tv', tvId, 'videos'],
    queryFn: () => fetchTMDB<{ results: Array<{ key: string; type: string; site: string }> }>(`/tv/${tvId}/videos`),
    enabled: !!tvId,
  });
}
