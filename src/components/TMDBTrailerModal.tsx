import { useState, useEffect } from 'react';
import { X, Loader2, Volume2, VolumeX } from 'lucide-react';
import { TMDBMovie, getTMDBImageUrl, useMovieVideos, useTVVideos } from '@/hooks/useTMDB';
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
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen || !movie) return null;

  const title = movie.title || movie.name || 'Trailer';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Cinema curtains effect */}
      <div className="absolute inset-y-0 left-0 w-8 md:w-16 bg-gradient-to-r from-cinema-red/30 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-8 md:w-16 bg-gradient-to-l from-cinema-red/30 to-transparent" />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-cinema-red transition-colors flex items-center justify-center"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Main content */}
      <div 
        className="relative w-full max-w-6xl mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">{title}</h2>
          <p className="text-cinema-red text-lg">🎬 Trailer Oficial</p>
        </div>

        {/* Video container */}
        <div className="relative aspect-video bg-cinema-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-cinema-red mx-auto mb-4" />
                <p className="text-white/70">Carregando trailer...</p>
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
              
              {/* Volume control */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-10"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <img
                src={getTMDBImageUrl(movie.backdrop_path || movie.poster_path, 'w780')}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="relative text-center p-8">
                <p className="text-2xl font-bold text-white mb-2">Trailer não disponível</p>
                <p className="text-white/70 max-w-md mx-auto">{movie.overview}</p>
              </div>
            </div>
          )}
        </div>

        {/* Movie info */}
        <div className="mt-6 text-center">
          <p className="text-white/70 max-w-2xl mx-auto line-clamp-2">{movie.overview}</p>
        </div>
      </div>
    </div>
  );
};

export default TMDBTrailerModal;
