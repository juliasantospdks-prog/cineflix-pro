import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { TMDBMovie } from '@/hooks/useTMDB';
import TMDBMovieCard from './TMDBMovieCard';
import { Button } from '@/components/ui/button';

interface TMDBGalleryProps {
  title: string;
  movies: TMDBMovie[] | undefined;
  isLoading: boolean;
  onPlayTrailer?: (movie: TMDBMovie) => void;
}

const TMDBGallery = ({ title, movies, isLoading, onPlayTrailer }: TMDBGalleryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-6 px-8">{title}</h2>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-cinema-red" />
        </div>
      </section>
    );
  }

  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="py-8 relative group/gallery">
      <div className="flex items-center justify-between mb-6 px-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          {title}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover/gallery:opacity-100 transition-opacity bg-white/5 hover:bg-white/10"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover/gallery:opacity-100 transition-opacity bg-white/5 hover:bg-white/10"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-8 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie) => (
          <div key={movie.id} className="flex-shrink-0 w-[200px]">
            <TMDBMovieCard movie={movie} onPlayTrailer={onPlayTrailer} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TMDBGallery;
