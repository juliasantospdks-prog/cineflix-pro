import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plan, Upsell } from '@/types';
import { upsells, WHATSAPP_NUMBER, KIRVANO_LINKS } from '@/data/cineflix';
import { cn } from '@/lib/utils';
import cineflixLogo from '@/assets/cineflix-logo.png';

interface PlanPopupProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
}

const PlanPopup = ({ isOpen, onClose, plan }: PlanPopupProps) => {
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);

  const toggleUpsell = (upsellId: string) => {
    setSelectedUpsells(prev =>
      prev.includes(upsellId)
        ? prev.filter(id => id !== upsellId)
        : [...prev, upsellId]
    );
  };

  const calculateTotal = (): number => {
    let total = plan.price;
    selectedUpsells.forEach(id => {
      const upsell = upsells.find(u => u.id === id);
      if (upsell) total += upsell.price;
    });
    return total;
  };

  const handleConfirm = () => {
    if (selectedUpsells.length > 0) {
      const upsellNames = selectedUpsells
        .map(id => upsells.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      const message = encodeURIComponent(
        `Olá! Quero assinar o CineflixPayment:\n📦 Plano: ${plan.name} - R$ ${plan.price.toFixed(2)}\n🎁 Adicionais: ${upsellNames}\n💰 Total: R$ ${calculateTotal().toFixed(2)}`
      );
      
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    } else {
      const link = KIRVANO_LINKS[plan.id];
      window.open(link, '_blank');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-gradient-to-b from-cinema-panel to-cinema-dark rounded-2xl overflow-hidden shadow-2xl border border-white/5 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cinema-red to-cinema-glow p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
            <img src={cineflixLogo} alt="CineflixPayment" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">Finalizar Assinatura</h3>
            <p className="text-white/80 text-sm">{plan.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan summary */}
          <div className="bg-cinema-dark/50 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{plan.icon}</span>
                <div>
                  <h4 className="font-bold text-white">{plan.name}</h4>
                  <p className="text-white/60 text-sm">{plan.period}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-cinema-glow">
                R$ {plan.price.toFixed(2)}
              </span>
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <Check className="w-4 h-4 text-cinema-red flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Upsells */}
          <div>
            <h4 className="font-bold text-white mb-3">Turbine sua experiência! 🚀</h4>
            <div className="space-y-3">
              {upsells.map(upsell => (
                <div
                  key={upsell.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200',
                    'bg-cinema-dark/50 border',
                    selectedUpsells.includes(upsell.id) 
                      ? 'border-cinema-red bg-cinema-red/10' 
                      : 'border-white/10 hover:border-cinema-red/30'
                  )}
                  onClick={() => toggleUpsell(upsell.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUpsells.includes(upsell.id)}
                    onChange={() => {}}
                    className="w-5 h-5 rounded border-white/20 bg-transparent text-cinema-red focus:ring-cinema-red"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{upsell.name}</div>
                    <div className="text-sm text-white/60">{upsell.description}</div>
                  </div>
                  <span className="text-cinema-glow font-bold">+R$ {upsell.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/70">Total:</span>
              <span className="text-3xl font-bold text-white">R$ {calculateTotal().toFixed(2)}</span>
            </div>
            <Button 
              variant="cinema" 
              size="lg" 
              className="w-full text-lg py-6" 
              onClick={handleConfirm}
            >
              ✅ CONFIRMAR E PAGAR
            </Button>
            <p className="text-center text-white/50 text-xs mt-3">
              Pagamento 100% seguro via Pix ou Cartão
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPopup;
