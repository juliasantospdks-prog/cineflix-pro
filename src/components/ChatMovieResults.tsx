import { CheckCircle2, PlayCircle, Star } from 'lucide-react';
import { TMDBMovie, getTMDBImageUrl } from '@/hooks/useTMDB';

interface ChatMovieResultsProps {
  query: string;
  movies: TMDBMovie[];
  onConfirm: (movie: TMDBMovie) => void;
}

const getTitle = (movie: TMDBMovie) => movie.title || movie.name || 'Título encontrado';
const getYear = (movie: TMDBMovie) =>
  movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4) || 'Catálogo';

const ChatMovieResults = ({ query, movies, onConfirm }: ChatMovieResultsProps) => {
  return (
    <div className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-cinema-red/25 bg-[#111b21] shadow-2xl">
      <div className="border-b border-white/10 bg-gradient-to-r from-cinema-red/25 via-[#202c33] to-[#202c33] px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cinema-glow">
          Resultado no catálogo
        </p>
        <p className="truncate text-sm font-bold text-white">{query}</p>
      </div>

      <div className="space-y-2 p-2.5">
        {movies.slice(0, 3).map((movie) => {
          const title = getTitle(movie);
          const rating = Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : '8.0';
          return (
            <div key={`${movie.media_type || 'movie'}-${movie.id}`} className="rounded-xl border border-white/10 bg-[#202c33] p-2">
              <div className="flex gap-2.5">
                <img
                  src={getTMDBImageUrl(movie.poster_path, 'w200')}
                  alt={`Poster de ${title}`}
                  className="h-[92px] w-[62px] flex-shrink-0 rounded-lg object-cover bg-black/40"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 text-sm font-black leading-tight text-white">{title}</h4>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                        {movie.media_type === 'tv' ? 'Série' : 'Filme'} · {getYear(movie)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-1.5 py-0.5 text-[10px] font-bold text-cinema-gold">
                      <Star className="h-3 w-3 fill-cinema-gold" />
                      {rating}
                    </span>
                  </div>

                  <p className="line-clamp-2 min-h-[28px] text-[11px] leading-snug text-white/65">
                    {movie.overview || 'Disponível para assistir dentro da CineflixPayment.'}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Disponível
                    </span>
                    <button
                      type="button"
                      onClick={() => onConfirm(movie)}
                      className="inline-flex items-center gap-1 rounded-full bg-cinema-red px-2.5 py-1.5 text-[11px] font-black text-white transition hover:bg-red-700 active:scale-95"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatMovieResults;