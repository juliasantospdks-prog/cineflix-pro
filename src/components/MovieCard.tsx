import { Play, X, Star } from 'lucide-react';
import { Movie } from '@/types';
import { Button } from '@/components/ui/button';

interface MovieCardProps {
  movie: Movie;
  onPlayTrailer: (movie: Movie) => void;
}

const MovieCard = ({ movie, onPlayTrailer }: MovieCardProps) => {
  return (
    <div className="movie-card group">
      <img
        src={movie.image}
        alt={movie.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-cinema-red font-semibold">{movie.category}</span>
            <span>•</span>
            <span>{movie.year}</span>
            <span>•</span>
            <span>{movie.duration}</span>
          </div>
          
          <h3 className="font-bold text-white text-lg leading-tight">{movie.title}</h3>
          
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-cinema-gold text-cinema-gold" />
            <span className="text-cinema-gold font-semibold">{movie.rating}</span>
          </div>
          
          <Button
            variant="cinema"
            size="sm"
            className="w-full mt-2"
            onClick={() => onPlayTrailer(movie)}
          >
            <Play className="w-4 h-4 fill-white" />
            Ver Trailer
          </Button>
        </div>
      </div>

      {/* Play button overlay */}
      <div className="play-overlay">
        <button
          onClick={() => onPlayTrailer(movie)}
          className="w-16 h-16 rounded-full bg-cinema-red/90 flex items-center justify-center hover:bg-cinema-red hover:scale-110 transition-all duration-300 shadow-glow"
        >
          <Play className="w-8 h-8 fill-white text-white ml-1" />
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
