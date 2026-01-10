import { Play, Info, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types';
import heroBanner from '@/assets/hero-banner.jpg';

interface HeroSectionProps {
  featuredMovie?: Movie;
  onOpenChat: () => void;
  onPlayTrailer: (movie: Movie) => void;
}

const HeroSection = ({ featuredMovie, onOpenChat, onPlayTrailer }: HeroSectionProps) => {
  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="CineflixPayment"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 pb-20">
        <div className="max-w-2xl animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cinema-red/20 border border-cinema-red/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-cinema-red animate-pulse" />
            <span className="text-sm font-semibold text-cinema-red">EXCLUSIVO 2026</span>
          </div>

          {/* Title */}
          <h1 className="font-cinema text-8xl text-white mb-4 leading-none glow-text">
            CINEFLIX<span className="text-cinema-red">PAYMENT</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            O melhor streaming do Brasil. Filmes e séries exclusivos, 
            qualidade cinematográfica e preços imbatíveis.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-cinema-gold text-cinema-gold" />
              <span className="text-cinema-gold font-bold">9.8</span>
              <span className="text-muted-foreground text-sm">Avaliação</span>
            </div>
            <div className="text-muted-foreground text-sm">
              <span className="text-white font-bold">10.000+</span> filmes e séries
            </div>
            <div className="text-muted-foreground text-sm">
              <span className="text-white font-bold">4K</span> Ultra HD
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              variant="cinema"
              size="xl"
              onClick={onOpenChat}
              className="animate-pulse-glow"
            >
              <Play className="w-5 h-5 fill-white" />
              ASSINAR AGORA
            </Button>
            
            {featuredMovie && (
              <Button
                variant="cinema-outline"
                size="xl"
                onClick={() => onPlayTrailer(featuredMovie)}
              >
                <Info className="w-5 h-5" />
                VER TRAILER
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
