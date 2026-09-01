import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CountdownBanner from '@/components/CountdownBanner';
import HeroSection from '@/components/HeroSection';
import TMDBGallery from '@/components/TMDBGallery';
import TMDBTrailerModal from '@/components/TMDBTrailerModal';
import SocialProof from '@/components/SocialProof';
import PlansSection from '@/components/PlansSection';
import AnimatedSection from '@/components/AnimatedSection';

import Footer from '@/components/Footer';
import ChatFAB from '@/components/ChatFAB';
import AshleyChat from '@/components/AshleyChat';
import SalesPage2026 from '@/components/SalesPage2026';
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
            movies={trendingMovies?.results}
            isLoading={trendingLoading}
            onPlayTrailer={handlePlayTrailer}
          />
        </div>

        {/* Social proof */}
        <AnimatedSection>
          <SocialProof />
        </AnimatedSection>

        {/* Sales page 2026 */}
        <AnimatedSection delay={0.2}>
          <SalesPage2026 />
        </AnimatedSection>

      </main>

      <Footer />
      <ChatFAB onClick={() => openChatWithMessage()} />
      <AshleyChat isOpen={isChatOpen} onClose={handleCloseChat} initialMessage={chatInitialMessage} />
      <TMDBTrailerModal movie={selectedMovie} isOpen={isTrailerOpen} onClose={() => { setIsTrailerOpen(false); setSelectedMovie(null); }} />
    </div>
  );
};

export default Index;
