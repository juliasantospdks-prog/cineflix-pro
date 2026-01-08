import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import TMDBGallery from '@/components/TMDBGallery';
import TMDBTrailerModal from '@/components/TMDBTrailerModal';
import ChatFAB from '@/components/ChatFAB';
import AshleyChat from '@/components/AshleyChat';
import { 
  useTrendingMovies, 
  useTrendingSeries, 
  usePopularMovies, 
  useActionMovies,
  useKoreanDramas,
  useRomanceMovies,
  TMDBMovie 
} from '@/hooks/useTMDB';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const { data: trendingMovies, isLoading: trendingLoading } = useTrendingMovies();
  const { data: trendingSeries, isLoading: seriesLoading } = useTrendingSeries();
  const { data: popularMovies, isLoading: popularLoading } = usePopularMovies();
  const { data: actionMovies, isLoading: actionLoading } = useActionMovies();
  const { data: koreanDramas, isLoading: koreanLoading } = useKoreanDramas();
  const { data: romanceMovies, isLoading: romanceLoading } = useRomanceMovies();

  const handlePlayTrailer = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setIsTrailerOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsChatOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isChatOpen) setIsChatOpen(true);
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isChatOpen]);

  return (
    <div className="min-h-screen bg-cinema-dark text-white">
      <Header />
      <main>
        <HeroSection onOpenChat={() => setIsChatOpen(true)} onPlayTrailer={() => trendingMovies?.results?.[0] && handlePlayTrailer(trendingMovies.results[0])} />
        <div className="space-y-4 pb-20">
          <TMDBGallery title="🔥 Em Alta" movies={trendingMovies?.results} isLoading={trendingLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="📺 Séries Populares" movies={trendingSeries?.results} isLoading={seriesLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="⚡ Ação" movies={actionMovies?.results} isLoading={actionLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="🌸 K-Dramas" movies={koreanDramas?.results} isLoading={koreanLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="💕 Romance" movies={romanceMovies?.results} isLoading={romanceLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="🎬 Populares" movies={popularMovies?.results} isLoading={popularLoading} onPlayTrailer={handlePlayTrailer} />
        </div>
      </main>
      <ChatFAB onClick={() => setIsChatOpen(true)} />
      <AshleyChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <TMDBTrailerModal movie={selectedMovie} isOpen={isTrailerOpen} onClose={() => { setIsTrailerOpen(false); setSelectedMovie(null); }} />
    </div>
  );
};

export default Index;
