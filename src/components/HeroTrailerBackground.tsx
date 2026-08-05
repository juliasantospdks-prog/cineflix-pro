import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface HeroTrailerBackgroundProps {
  videoKey?: string | null;
  title: string;
}

/**
 * Fundo do hero com o trailer rodando automaticamente (sem som, em loop).
 * Só aparece depois que o player está pronto, então a imagem de fundo
 * continua servindo de fallback e não há "flash" preto.
 */
const HeroTrailerBackground = ({ videoKey, title }: HeroTrailerBackgroundProps) => {
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    setReady(false);
  }, [videoKey]);

  if (!videoKey || reducedMotion) return null;

  const src =
    `https://www.youtube-nocookie.com/embed/${videoKey}` +
    `?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoKey}` +
    `&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`;

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      <iframe
        key={videoKey}
        src={src}
        title={`Trailer de ${title}`}
        allow="autoplay; encrypted-media"
        loading="lazy"
        tabIndex={-1}
        onLoad={() => setReady(true)}
        className="absolute left-1/2 top-1/2 h-[130%] w-[178vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
      />
      {/* Máscara para esconder qualquer UI do player e manter o clima cinema */}
      <div className="absolute inset-0 bg-black/25" />
    </motion.div>
  );
};

export default HeroTrailerBackground;
