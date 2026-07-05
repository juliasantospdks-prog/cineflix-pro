import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';



interface AshleyAudioBubbleProps {
  url: string;
  className?: string;
}

const BAR_COUNT = 34;

// Pseudo-random but stable waveform pattern per url
function heightsFor(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const base = 0.22 + ((h % 1000) / 1000) * 0.78;
    // Add slight center bias
    const bias = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
    out.push(Math.min(1, base * (0.6 + bias * 0.6)));
  }
  return out;
}

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

const AshleyAudioBubble = ({ url, className }: AshleyAudioBubbleProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [rate, setRate] = useState<1 | 1.5 | 2>(1);
  const [heard, setHeard] = useState(false);

  const heights = useRef(heightsFor(url)).current;

  useEffect(() => {
    const a = new Audio(url);
    a.preload = 'metadata';
    audioRef.current = a;
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => {
      setPlaying(false);
      setHeard(true);
      setCurrent(a.duration || 0);
    };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.pause();
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [url]);

  const tick = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime);
    if (!a.paused && !a.ended) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else {
      a.playbackRate = rate;
      a.play().then(() => {
        setPlaying(true);
        rafRef.current = requestAnimationFrame(tick);
      }).catch(() => setPlaying(false));
    }
  };

  const cycleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * duration;
    setCurrent(a.currentTime);
  };

  const progress = duration > 0 ? current / duration : 0;
  const displayTime = playing || current > 0 ? formatTime(current) : formatTime(duration);

  return (
    <div className={cn('flex items-center gap-2.5 min-w-[240px]', className)}>
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-cinema-red/40">
          <img src={ashleyAvatar.url} alt="Ashley" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-cinema-red flex items-center justify-center border-2 border-[#202c33]">
          <Mic className="w-2 h-2 text-white" />
        </div>
      </div>

      {/* Play */}
      <button
        onClick={toggle}
        aria-label={playing ? 'Pausar áudio' : 'Ouvir Ashley'}
        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-90"
      >
        {playing ? (
          <Pause className="w-4 h-4 text-[#202c33]" fill="currentColor" />
        ) : (
          <Play className="w-4 h-4 text-[#202c33] translate-x-[1px]" fill="currentColor" />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div
          className="relative h-6 flex items-center gap-[2px] cursor-pointer select-none"
          onClick={seekFromEvent}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          {heights.map((h, i) => {
            const barPct = (i + 0.5) / BAR_COUNT;
            const active = barPct <= progress;
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-full transition-colors duration-75',
                  active ? 'bg-white' : 'bg-white/35',
                  playing && active && 'animate-pulse'
                )}
                style={{ height: `${Math.max(15, h * 100)}%` }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/60 font-medium">
          <span>{displayTime}</span>
          {!heard && !playing && current === 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-cinema-red animate-pulse" aria-label="Não ouvido" />
          )}
        </div>
      </div>

      {/* Speed */}
      <button
        onClick={cycleRate}
        aria-label="Velocidade do áudio"
        className="text-[10px] font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full px-2 py-0.5 flex-shrink-0 transition-colors"
      >
        {rate}x
      </button>
    </div>
  );
};

export default AshleyAudioBubble;
