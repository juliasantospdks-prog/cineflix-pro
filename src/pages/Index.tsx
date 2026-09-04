import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CountdownBanner from '@/components/CountdownBanner';
import HeroSection from '@/components/HeroSection';
import TMDBGallery from '@/components/TMDBGallery';
import TMDBTrailerModal from '@/components/TMDBTrailerModal';
import PlansSection from '@/components/PlansSection';
import Footer from '@/components/Footer';
import ChatFAB from '@/components/ChatFAB';
import AshleyChat from '@/components/AshleyChat';
import { movies as localMovies } from '@/data/cineflix';
import { 
  useTrendingMovies, 
  TMDBMovie 
} from '@/hooks/useTMDB';


const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const openChatWithMessage = (message?: string) => {
    setChatInitialMessage(message);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setChatInitialMessage(undefined);
  };

  const { data: trendingMovies, isLoading: trendingLoading } = useTrendingMovies();
  const carouselMovies: TMDBMovie[] = trendingMovies?.results?.length
    ? trendingMovies.results
    : localMovies.map((movie) => ({
        id: Number(movie.id),
        title: movie.title,
        poster_path: null,
        backdrop_path: null,
        overview: movie.description,
        release_date: `${movie.year}-01-01`,
        vote_average: movie.rating,
        genre_ids: [],
        media_type: 'movie',
        localImage: movie.image,
      } as TMDBMovie & { localImage: string }));

  const handlePlayTrailer = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setIsTrailerOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsChatOpen(true), 8000);
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
    <div className="min-h-screen bg-background text-foreground">
      <CountdownBanner />
      <Header />
      <main>
        <HeroSection 
          onOpenChat={() => openChatWithMessage()} 
          onPlayTrailer={handlePlayTrailer}
          movies={trendingMovies?.results}
        />

        {/* PLANOS — logo após o Hero para captar desejo imediato */}
        <div id="planos">
          <PlansSection onOpenChatWithPlan={openChatWithMessage} />
        </div>

        {/* Catálogo — uma trilha só, a que realmente converte */}
        <div className="pb-4">
          <TMDBGallery
            title="Em alta agora na CineflixPayment"
            movies={carouselMovies}
            isLoading={trendingLoading && carouselMovies.length === 0}
            onPlayTrailer={handlePlayTrailer}
          />
        </div>

      </main>

      <Footer />
      <ChatFAB onClick={() => openChatWithMessage()} />
      <AshleyChat isOpen={isChatOpen} onClose={handleCloseChat} initialMessage={chatInitialMessage} />
      <TMDBTrailerModal movie={selectedMovie} isOpen={isTrailerOpen} onClose={() => { setIsTrailerOpen(false); setSelectedMovie(null); }} />
    </div>
  );
};

export default Index;
