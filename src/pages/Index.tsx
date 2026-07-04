import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import CountdownBanner from '@/components/CountdownBanner';
import HeroSection from '@/components/HeroSection';
import TMDBGallery from '@/components/TMDBGallery';
import TMDBTrailerModal from '@/components/TMDBTrailerModal';
import SocialProof from '@/components/SocialProof';
import PlansSection from '@/components/PlansSection';

import Footer from '@/components/Footer';
import ChatFAB from '@/components/ChatFAB';
import AshleyChat from '@/components/AshleyChat';
import ContentLock from '@/components/ContentLock';
import SalesPage2026 from '@/components/SalesPage2026';
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
  const { user } = useAuth();
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

        {/* Galleries */}
        <div className="space-y-1 pb-4">
          <TMDBGallery title="🔥 Em Alta" movies={trendingMovies?.results} isLoading={trendingLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="📺 Séries Populares" movies={trendingSeries?.results?.slice(0, 12)} isLoading={seriesLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="⚡ Ação" movies={actionMovies?.results} isLoading={actionLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="🌸 K-Dramas" movies={koreanDramas?.results} isLoading={koreanLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="💕 Romance" movies={romanceMovies?.results} isLoading={romanceLoading} onPlayTrailer={handlePlayTrailer} />
          <TMDBGallery title="🎬 Populares" movies={popularMovies?.results} isLoading={popularLoading} onPlayTrailer={handlePlayTrailer} />
          
          {/* Upsell CTA */}
          {(
            <motion.div 
              className="px-4 md:px-8 py-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-r from-cinema-red/10 via-cinema-panel to-cinema-red/10 border border-cinema-red/20 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cinema-red/5 to-transparent animate-shimmer" />
                <div className="relative z-10">
                  <p className="text-xl md:text-2xl font-bold text-white mb-2">🔥 Quer assistir tudo sem limites?</p>
                  <p className="text-white/50 text-sm mb-5">Conheça nossos planos a partir de R$ 29,90/mês</p>
                  <button
                    onClick={() => openChatWithMessage('Quero conhecer os planos disponíveis')}
                    className="inline-block px-8 py-3.5 rounded-xl font-bold bg-cinema-red hover:bg-cinema-glow text-white transition-all duration-300 hover:scale-105 shadow-button"
                  >
                    Ver Planos
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Social proof */}
        <SocialProof />

        {/* Sales page 2026 */}
        <SalesPage2026 />

        {/* APK Promo no final, como reforço */}
        <AppPromoSection />
      </main>
      <Footer />
      <ChatFAB onClick={() => openChatWithMessage()} />
      <AshleyChat isOpen={isChatOpen} onClose={handleCloseChat} initialMessage={chatInitialMessage} />
      <TMDBTrailerModal movie={selectedMovie} isOpen={isTrailerOpen} onClose={() => { setIsTrailerOpen(false); setSelectedMovie(null); }} />
    </div>
  );
};

export default Index;
