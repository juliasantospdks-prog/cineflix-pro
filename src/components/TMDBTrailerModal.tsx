import { useState, useEffect } from 'react';
import { X, Loader2, Volume2, VolumeX, Star, Calendar, Play } from 'lucide-react';
import { TMDBMovie, getTMDBImageUrl, useMovieVideos, useTVVideos } from '@/hooks/useTMDB';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TMDBTrailerModalProps {
  movie: TMDBMovie | null;
  isOpen: boolean;
  onClose: () => void;
}

const TMDBTrailerModal = ({ movie, isOpen, onClose }: TMDBTrailerModalProps) => {
  const [isMuted, setIsMuted] = useState(false);
  
  const isTV = !!movie?.first_air_date || movie?.media_type === 'tv';
  
  const { data: movieVideos, isLoading: movieLoading } = useMovieVideos(
    !isTV && movie ? movie.id : null
  );
  const { data: tvVideos, isLoading: tvLoading } = useTVVideos(
    isTV && movie ? movie.id : null
  );
  
  const videos = isTV ? tvVideos : movieVideos;
  const isLoading = isTV ? tvLoading : movieLoading;
  
  const trailer = videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  ) || videos?.results?.[0];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen || !movie) return null;

  const title = movie.title || movie.name || 'Trailer';
  const rating = movie.vote_average?.toFixed(1) || '0';
  const year = movie.release_date?.substring(0, 4) || movie.first_air_date?.substring(0, 4) || '';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
        onClick={onClose}
      >
        {/* Cinema curtains */}
        <div className="absolute inset-y-0 left-0 w-4 md:w-12 bg-gradient-to-r from-cinema-red/20 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-4 md:w-12 bg-gradient-to-l from-cinema-red/20 to-transparent" />
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-cinema-red transition-colors flex items-center justify-center backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-full max-w-5xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Video */}
          <div className="relative aspect-video bg-cinema-dark rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-cinema-red mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Carregando trailer...</p>
                </div>
              </div>
            ) : trailer ? (
              <>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&showinfo=0&controls=1&playsinline=1`}
                  title={title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ border: 'none' }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                  className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-10 backdrop-blur-sm"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <img
                  src={getTMDBImageUrl(movie.backdrop_path || movie.poster_path, 'w780')}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="relative text-center p-8">
                  <p className="text-xl font-bold text-white mb-2">Trailer não disponível</p>
                  <p className="text-white/60 max-w-md mx-auto text-sm">{movie.overview}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info + CTAs */}
          <div className="mt-5 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{title}</h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-cinema-gold"><Star className="w-4 h-4 fill-cinema-gold" /> {rating}</span>
                {year && <span className="text-white/50 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {year}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a
                href="#planos"
                onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }), 300); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cinema-red hover:bg-cinema-glow text-white font-bold text-sm transition-all duration-300 hover:scale-105 shadow-button"
              >
                <Play className="h-4 w-4 fill-current" /> Assinar e assistir
              </a>
            </div>
          </div>

          {movie.overview && (
            <p className="text-white/50 text-sm mt-3 line-clamp-2 max-w-3xl">{movie.overview}</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TMDBTrailerModal;
