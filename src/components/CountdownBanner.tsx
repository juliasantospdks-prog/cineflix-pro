import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock } from 'lucide-react';

const CountdownBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 47, seconds: 33 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className="bg-gradient-to-r from-cinema-red via-red-600 to-cinema-red relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-4 md:gap-8 text-white text-xs md:text-sm relative z-10 flex-wrap">
        <motion.div 
          className="flex items-center gap-2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame className="w-4 h-4 animate-pulse" />
          <span className="font-bold">OFERTA ESPECIAL</span>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1 font-mono font-bold">
            <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad(timeLeft.hours)}</span>
            <span className="animate-pulse">:</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad(timeLeft.minutes)}</span>
            <span className="animate-pulse">:</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad(timeLeft.seconds)}</span>
          </div>
        </div>

        <span className="hidden md:inline text-cinema-gold font-bold">Filmes & Séries a partir de R$ 29,90/mês</span>
      </div>
    </motion.div>
  );
};

export default CountdownBanner;

