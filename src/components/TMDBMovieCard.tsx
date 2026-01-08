import { useState } from 'react';
import { Play, Star, Info } from 'lucide-react';
import { TMDBMovie, getTMDBImageUrl } from '@/hooks/useTMDB';
import { cn } from '@/lib/utils';

interface TMDBMovieCardProps {
  movie: TMDBMovie;
  onPlayTrailer?: (movie: TMDBMovie) => void;
}

const TMDBMovieCard = ({ movie, onPlayTrailer }: TMDBMovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const title = movie.title || movie.name || 'Sem título';
  const year = movie.release_date?.substring(0, 4) || movie.first_air_date?.substring(0, 4) || '';
  const rating = movie.vote_average.toFixed(1);

  return (
    <div
      className="movie-card group relative overflow-hidden rounded-xl bg-cinema-panel border border-white/5 transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={imageError ? '/placeholder.svg' : getTMDBImageUrl(movie.poster_path, 'w500')}
          alt={title}
          className={cn(
            'w-full h-full object-cover transition-transform duration-700',
            isHovered && 'scale-110'
          )}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {/* Gradient overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-300',
          isHovered ? 'opacity-100' : 'opacity-60'
        )} />
        
        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-white">{rating}</span>
        </div>
        
        {/* Year badge */}
        {year && (
          <div className="absolute top-3 left-3 bg-cinema-red/90 px-2 py-1 rounded-lg">
            <span className="text-xs font-bold text-white">{year}</span>
          </div>
        )}
        
        {/* Hover overlay with actions */}
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-300',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <button
            onClick={() => onPlayTrailer?.(movie)}
            className="w-16 h-16 rounded-full bg-cinema-red/90 hover:bg-cinema-red flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-2xl"
          >
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </button>
          
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-300">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Mais Info</span>
          </button>
        </div>
        
        {/* Title and info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{title}</h3>
          {isHovered && movie.overview && (
            <p className="text-xs text-white/70 line-clamp-2 animate-fade-in">
              {movie.overview}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TMDBMovieCard;
