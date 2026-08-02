import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { TMDBMovie } from '@/hooks/useTMDB';
import TMDBMovieCard from './TMDBMovieCard';
import { Button } from '@/components/ui/button';
import { motion, useMotionValue } from 'framer-motion';

interface TMDBGalleryProps {
  title: string;
  movies: TMDBMovie[] | undefined;
  isLoading: boolean;
  onPlayTrailer?: (movie: TMDBMovie) => void;
}

const TMDBGallery = ({ title, movies, isLoading, onPlayTrailer }: TMDBGalleryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


  if (isLoading) {
    return (
      <section className="py-6">
        <div className="px-4 md:px-8 mb-4">
          <div className="h-7 w-48 bg-white/5 rounded-lg animate-shimmer" />
        </div>
        <div className="flex gap-3 px-4 md:px-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] md:w-[200px] aspect-[2/3] bg-cinema-panel rounded-xl animate-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (!movies || movies.length === 0) return null;

  const sectionId = title.includes('Alta') ? 'filmes' 
    : title.includes('Séries') ? 'series' 
    : title.includes('K-Drama') ? 'kdramas' 
    : title.includes('Romance') ? 'romance'
    : title.includes('Ação') ? 'acao'
    : title.includes('Popular') ? 'populares'
    : undefined;

  return (
    <motion.section 
      id={sectionId} 
      className="py-4 md:py-6 relative group/gallery"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-cinema-red rounded-full" />
          <h2 className="text-lg md:text-2xl font-bold text-white">
            {title}
          </h2>
          <span className="hidden md:inline text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
            {movies.length} títulos
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Rolar para a esquerda"
            className="w-8 h-8 md:w-9 md:h-9 opacity-0 group-hover/gallery:opacity-100 transition-opacity bg-white/5 hover:bg-cinema-red/20 hover:text-white rounded-full"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Rolar para a direita"
            className="w-8 h-8 md:w-9 md:h-9 opacity-0 group-hover/gallery:opacity-100 transition-opacity bg-white/5 hover:bg-cinema-red/20 hover:text-white rounded-full"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie, i) => (
          <div key={movie.id} className="flex-shrink-0 w-[140px] md:w-[200px] snap-start">
            <TMDBMovieCard movie={movie} onPlayTrailer={onPlayTrailer} index={i} />
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default TMDBGallery;
