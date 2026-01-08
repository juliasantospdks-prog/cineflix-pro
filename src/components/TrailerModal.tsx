import { X } from 'lucide-react';
import { Movie } from '@/types';
import { useEffect } from 'react';

interface TrailerModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

const TrailerModal = ({ movie, isOpen, onClose }: TrailerModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !movie) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
      
      {/* Cinema curtains effect */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cinema-red/20 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cinema-red/20 to-transparent" />
      
      {/* Modal content */}
      <div 
        className="relative w-full max-w-5xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-cinema-red flex items-center justify-center transition-all duration-300 hover:scale-110"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Movie title */}
        <div className="mb-4 text-center">
          <h2 className="font-cinema text-3xl md:text-4xl text-white glow-text">{movie.title}</h2>
          <p className="text-muted-foreground mt-1">{movie.category} • {movie.year} • {movie.duration}</p>
        </div>

        {/* Cinema screen */}
        <div className="cinema-screen aspect-video bg-black">
          <iframe
            src={`${movie.trailerUrl}?autoplay=1&mute=0`}
            title={movie.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Movie info */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground max-w-2xl mx-auto">{movie.description}</p>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
