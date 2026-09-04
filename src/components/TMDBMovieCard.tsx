import { useState } from 'react';
import { Play, Star } from 'lucide-react';
import { TMDBMovie, getTMDBImageUrl } from '@/hooks/useTMDB';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TMDBMovieCardProps {
  movie: TMDBMovie;
  onPlayTrailer?: (movie: TMDBMovie) => void;
  index?: number;
}

const TMDBMovieCard = ({ movie, onPlayTrailer, index = 0 }: TMDBMovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const title = movie.title || movie.name || 'Sem título';
  const year = movie.release_date?.substring(0, 4) || movie.first_air_date?.substring(0, 4) || '';
  const rating = movie.vote_average?.toFixed(1) || '0';
  const ratingColor = parseFloat(rating) >= 7 ? 'text-green-400' : parseFloat(rating) >= 5 ? 'text-yellow-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      whileHover={{ 
        y: -10, 
        scale: 1.05,
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-xl bg-cinema-panel border border-white/5 transition-all duration-500 hover:border-cinema-red/30 hover:shadow-glow cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlayTrailer?.(movie)}
    >

      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={imageError ? '/placeholder.svg' : movie.localImage || getTMDBImageUrl(movie.poster_path, 'w500')}
          alt={`Poster do filme ${title}`}
          className={cn(
            'w-full h-full object-cover transition-transform duration-700',
            isHovered && 'scale-110'
          )}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        
        {/* Gradient overlay */}
        <div className={cn(
          'absolute inset-0 transition-all duration-500',
          isHovered 
            ? 'bg-gradient-to-t from-black via-black/60 to-black/20' 
            : 'bg-gradient-to-t from-black/80 via-transparent to-transparent'
        )} />
        
        {/* Rating badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
          <Star className="w-3 h-3 text-cinema-gold fill-cinema-gold" />
          <span className={cn("text-xs font-bold", ratingColor)}>{rating}</span>
        </div>
        
        {/* Year badge */}
        {year && (
          <div className="absolute top-2.5 left-2.5 bg-cinema-red/90 backdrop-blur-sm px-2 py-1 rounded-lg">
            <span className="text-[10px] font-bold text-white">{year}</span>
          </div>
        )}
        
        {/* Play button */}
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-300',
          isHovered ? 'opacity-100' : 'md:opacity-0 opacity-80'
        )}>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Assistir trailer"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-cinema-red/90 hover:bg-cinema-red flex items-center justify-center shadow-2xl shadow-cinema-red/40 backdrop-blur-sm"
          >
            <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
          </motion.button>
          <span className="text-[10px] text-white/80 font-medium tracking-wider uppercase">Assistir Trailer</span>
        </div>
        
        {/* Title and info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-white text-sm line-clamp-2 mb-1 drop-shadow-lg">{title}</h3>
          {isHovered && movie.overview && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] text-white/70 line-clamp-2"
            >
              {movie.overview}
            </motion.p>
          )}
        </div>

        {/* Cinematic shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      </div>
    </motion.div>
  );
};

export default TMDBMovieCard;

