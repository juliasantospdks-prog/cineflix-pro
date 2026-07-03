import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ashleyAvatar from '@/assets/ashley-avatar.png.asset.json';

interface ChatFABProps {
  onClick: () => void;
}

const ChatFAB = ({ onClick }: ChatFABProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    const hide = setTimeout(() => setShowTooltip(false), 8000);
    return () => { clearTimeout(timer); clearTimeout(hide); };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-white text-cinema-dark px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium max-w-[200px] relative"
          >
            Oi! Precisa de ajuda? 😊
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onClick}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-cinema-red to-cinema-glow flex items-center justify-center shadow-button group relative overflow-hidden ring-2 ring-white/30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: ['0 0 20px hsl(357 91% 47% / 0.4)', '0 0 35px hsl(357 91% 47% / 0.6)', '0 0 20px hsl(357 91% 47% / 0.4)'] }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
        aria-label="Abrir chat com Ashley"
      >
        <img
          src={ashleyAvatar.url}
          alt="Ashley — Suporte CineflixPayment"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
        />

        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-cinema-red text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
          1
        </span>
      </motion.button>
    </div>
  );
};

export default ChatFAB;
