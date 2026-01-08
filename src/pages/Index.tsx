import { useState, useEffect } from 'react';
import { Movie } from '@/types';
import { movies } from '@/data/cineflix';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MovieGallery from '@/components/MovieGallery';
import TrailerModal from '@/components/TrailerModal';
import AshleyChat from '@/components/AshleyChat';
import ChatFAB from '@/components/ChatFAB';

const Index = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handlePlayTrailer = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsTrailerOpen(true);
  };

  const handleCloseTrailer = () => {
    setIsTrailerOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  };

  // Auto open chat after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChatOpen(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isChatOpen) {
        setIsChatOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isChatOpen]);

  const actionMovies = movies.filter(m => ['Ação', 'Super-Herói', 'Crime'].includes(m.category));
  const dramaMovies = movies.filter(m => ['Romance', 'Ficção Científica', 'Terror'].includes(m.category));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection 
          featuredMovie={movies[4]} 
          onOpenChat={() => setIsChatOpen(true)}
          onPlayTrailer={handlePlayTrailer}
        />

        <section id="filmes">
          <MovieGallery 
            movies={actionMovies} 
            title="Ação & Aventura" 
            onPlayTrailer={handlePlayTrailer}
          />
        </section>

        <section id="series">
          <MovieGallery 
            movies={dramaMovies} 
            title="Drama & Suspense" 
            onPlayTrailer={handlePlayTrailer}
          />
        </section>

        <MovieGallery 
          movies={movies} 
          title="Todos os Títulos" 
          onPlayTrailer={handlePlayTrailer}
        />
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <div className="font-cinema text-3xl text-white mb-4">
            CINEFLIX<span className="text-cinema-red">PAYMENT</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2026 CineflixPayment. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Trailer Modal */}
      <TrailerModal 
        movie={selectedMovie} 
        isOpen={isTrailerOpen} 
        onClose={handleCloseTrailer} 
      />

      {/* Chat */}
      <AshleyChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      {/* Floating Action Button */}
      {!isChatOpen && (
        <ChatFAB onClick={() => setIsChatOpen(true)} />
      )}
    </div>
  );
};

export default Index;
