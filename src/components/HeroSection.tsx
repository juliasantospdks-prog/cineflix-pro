import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { TMDBMovie, getTMDBImageUrl } from '@/hooks/useTMDB';
import cineflixLogo from '@/assets/cineflix-logo.png';


interface HeroSectionProps {
  onOpenChat: () => void;
  onPlayTrailer?: (movie: TMDBMovie) => void;
  movies?: TMDBMovie[];
}

const HeroSection = ({ onOpenChat, onPlayTrailer, movies }: HeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const heroMovies = movies?.slice(0, 5) || [];
  const current = heroMovies[currentIndex];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const goNext = useCallback(() => {
    if (heroMovies.length === 0) return;
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % heroMovies.length);
  }, [heroMovies.length]);

  const goPrev = useCallback(() => {
    if (heroMovies.length === 0) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + heroMovies.length) % heroMovies.length);
  }, [heroMovies.length]);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [goNext, heroMovies.length]);


  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0, scale: 1.05 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, scale: 1.05 }),
  };

  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  const textItemVariants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const buttonHoverVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.03, transition: { duration: 0.3 } },
    tap: { scale: 0.98 },
  };


  if (!current) {
    // Fallback static hero
    return (
      <section className="relative h-[90vh] min-h-[600px] flex items-end overflow-hidden bg-cinema-dark">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <div className="relative container mx-auto px-4 pb-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="font-cinema text-5xl md:text-7xl lg:text-8xl text-white mb-4 leading-none glow-text">
              CINEFLIX<span className="text-cinema-red">PAYMENT</span>
              <span className="sr-only"> — Assinatura de Streaming e IPTV</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              O melhor streaming do Brasil. Filmes e séries exclusivos.
            </p>
            <Button variant="cinema" size="xl" onClick={onOpenChat} className="animate-pulse-glow">
              <Play className="w-5 h-5 fill-white" />
              ASSINAR AGORA
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  const title = current.title || current.name || '';
  const rating = current.vote_average?.toFixed(1) || '0';
  const year = current.release_date?.substring(0, 4) || current.first_air_date?.substring(0, 4) || '';

  return (
    <section className="relative h-[90vh] min-h-[650px] flex items-end overflow-hidden">
      {/* Animated background images */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <img
            src={getTMDBImageUrl(current.backdrop_path, 'original')}
            alt={`Banner do filme ${title}`}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40 z-[1]" />

      {/* Ambient glow */}
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-cinema-red/10 blur-[120px] z-[1]" />

      {/* Navigation arrows */}
      {heroMovies.length > 1 && (
        <>
          <button onClick={goPrev} aria-label="Filme anterior" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-cinema-red/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group">
            <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={goNext} aria-label="Próximo filme" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-cinema-red/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group">
            <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative z-[2] container mx-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            {/* Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cinema-red/20 border border-cinema-red/40 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-cinema-red animate-pulse" />
                <span className="text-xs font-bold text-cinema-red tracking-wider">EXCLUSIVO</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                <span className="text-xs text-white/80">🎬 Disponível em 4K Ultra HD</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-cinema text-4xl md:text-6xl lg:text-7xl text-white mb-3 leading-none glow-text">
              {title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-cinema-gold text-cinema-gold" />
                <span className="text-cinema-gold font-bold text-lg">{rating}</span>
              </div>
              {year && <span className="text-white/60 text-sm border border-white/20 px-2 py-0.5 rounded">{year}</span>}
              <span className="text-white/60 text-sm">4K Ultra HD</span>
              <span className="px-2 py-0.5 rounded bg-cinema-red/80 text-white text-xs font-bold">EXCLUSIVO</span>
            </div>

            {/* Synopsis */}
            <p className="text-base md:text-lg text-white/70 mb-6 leading-relaxed line-clamp-3 max-w-xl">
              {current.overview}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="cinema"
                size="xl"
                onClick={() => onPlayTrailer?.(current)}
                className="animate-pulse-glow gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                ASSISTIR TRAILER
              </Button>
              <Button
                variant="cinema-outline"
                size="xl"
                onClick={onOpenChat}
                className="gap-2"
              >
                <img src={cineflixLogo} alt="" className="w-5 h-5" />
                ASSINAR AGORA
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        {heroMovies.length > 1 && (
          <div className="flex gap-2 mt-8">
            {heroMovies.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === currentIndex 
                    ? 'w-10 bg-cinema-red shadow-[0_0_10px_hsl(357_91%_47%/0.6)]' 
                    : 'w-4 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-[1]" />
    </section>
  );
};

export default HeroSection;
