import { Movie } from '@/types';
import MovieCard from './MovieCard';

interface MovieGalleryProps {
  movies: Movie[];
  title: string;
  onPlayTrailer: (movie: Movie) => void;
}

const MovieGallery = ({ movies, title, onPlayTrailer }: MovieGalleryProps) => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="font-cinema text-3xl md:text-4xl text-white mb-8 flex items-center gap-4">
          <span className="w-1 h-8 bg-gradient-to-b from-cinema-red to-cinema-glow rounded-full" />
          {title}
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onPlayTrailer={onPlayTrailer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MovieGallery;
