import avatarMain from '@/assets/avatar-main.jpg';

interface ChatFABProps {
  onClick: () => void;
}

const ChatFAB = ({ onClick }: ChatFABProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-cinema-red to-cinema-glow flex items-center justify-center shadow-button animate-pulse-glow hover:scale-110 transition-transform duration-300 group overflow-hidden"
      aria-label="Abrir chat"
    >
      <img 
        src={avatarMain} 
        alt="CineflixPayment" 
        className="w-14 h-14 rounded-full object-cover group-hover:scale-110 transition-transform"
      />
      
      {/* Notification badge */}
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-cinema-red text-xs font-bold rounded-full flex items-center justify-center">
        1
      </span>
      
      {/* Ripple effect */}
      <span className="absolute inset-0 rounded-full border-2 border-cinema-red animate-ping opacity-30" />
    </button>
  );
};

export default ChatFAB;
