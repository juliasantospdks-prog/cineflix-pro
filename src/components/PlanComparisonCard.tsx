import { useEffect, useState } from 'react';
import { Film, Package, Theater, Tv, Castle, TrendingDown, Zap } from 'lucide-react';

const COMPETITORS = [
  { name: 'Netflix Premium', price: 59.90, icon: Film },
  { name: 'Amazon Prime', price: 19.90, icon: Package },
  { name: 'HBO Max', price: 34.90, icon: Theater },
  { name: 'Globoplay', price: 29.90, icon: Tv },
  { name: 'Disney+', price: 33.90, icon: Castle },
];

interface PlanComparisonCardProps {
  cineflixPrice: number;
  planLabel: string;
}

const PlanComparisonCard = ({ cineflixPrice, planLabel }: PlanComparisonCardProps) => {
  const total = COMPETITORS.reduce((s, c) => s + c.price, 0);
  const savings = total - cineflixPrice;
  const [animatedSavings, setAnimatedSavings] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 900;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedSavings(savings * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [savings]);

  return (
    <div className="rounded-2xl overflow-hidden border border-cinema-red/40 bg-gradient-to-br from-cinema-panel via-black to-cinema-panel shadow-[0_0_30px_rgba(220,38,38,0.15)]">
      <div className="px-4 py-3 bg-gradient-to-r from-cinema-red/25 to-transparent border-b border-cinema-red/30">
        <p className="text-[10px] uppercase tracking-widest text-cinema-red font-bold flex items-center gap-1.5">
          <TrendingDown className="w-3 h-3" />
          Compare com o que você já paga
        </p>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {COMPETITORS.map((c) => {
          const Icon = c.icon;
          return <div key={c.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/60">
              <Icon className="h-4 w-4" />
              <span className="line-through decoration-white/30">{c.name}</span>
            </div>
            <span className="text-white/50 font-mono text-xs">R$ {c.price.toFixed(2).replace('.', ',')}</span>
          </div>
        })}

        <div className="border-t border-white/10 mt-2 pt-2 flex items-center justify-between text-sm">
          <span className="text-white/70 uppercase tracking-wide text-[11px] font-semibold">Total separado</span>
          <span className="text-white font-bold font-mono">R$ {total.toFixed(2).replace('.', ',')}/mês</span>
        </div>
      </div>

      <div className="px-4 py-3 bg-gradient-to-r from-cinema-red to-red-900 text-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
            <span className="text-[10px] uppercase tracking-widest font-bold">CineflixPayment</span>
          </div>
          <span className="text-lg font-black">R$ {cineflixPrice.toFixed(2).replace('.', ',')}</span>
        </div>
        <p className="text-[11px] text-white/85 leading-tight">
          {planLabel} — catálogo completo e futebol ao vivo em um só lugar.
        </p>
      </div>

      <div className="px-4 py-3 bg-black/60 border-t border-cinema-red/30 text-center">
        <p className="text-[10px] uppercase tracking-widest text-white/50">Você economiza</p>
        <p className="text-2xl font-black bg-gradient-to-r from-yellow-300 via-cinema-glow to-yellow-300 bg-clip-text text-transparent">
          R$ {animatedSavings.toFixed(2).replace('.', ',')}
        </p>
        <p className="text-[10px] text-white/60">todo mês</p>
      </div>
    </div>
  );
};

export default PlanComparisonCard;
