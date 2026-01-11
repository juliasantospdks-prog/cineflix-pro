import { useState } from 'react';
import { Check, Plus, ShoppingCart } from 'lucide-react';
import { plans, upsells, KIRVANO_LINKS, WHATSAPP_NUMBER } from '@/data/cineflix';
import { cn } from '@/lib/utils';
import { Plan, Upsell } from '@/types';
import planMensalIcon from '@/assets/plan-mensal-icon.png';
import planTrimestralIcon from '@/assets/plan-trimestral-icon.png';
import planAnualIcon from '@/assets/plan-anual-icon.png';

const PlansSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [showUpsells, setShowUpsells] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowUpsells(true);
  };

  const toggleUpsell = (upsellId: string) => {
    setSelectedUpsells(prev =>
      prev.includes(upsellId)
        ? prev.filter(id => id !== upsellId)
        : [...prev, upsellId]
    );
  };

  const calculateTotal = (): number => {
    let total = selectedPlan?.price || 0;
    selectedUpsells.forEach(id => {
      const upsell = upsells.find(u => u.id === id);
      if (upsell) total += upsell.price;
    });
    return total;
  };

  const handleCheckout = () => {
    if (!selectedPlan) return;

    if (selectedUpsells.length > 0) {
      // With upsells, go to WhatsApp for VIP service
      const upsellNames = selectedUpsells
        .map(id => upsells.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      const message = encodeURIComponent(
        `Olá! Quero assinar:\n📦 Plano: ${selectedPlan.name} - R$ ${selectedPlan.price.toFixed(2)}\n🎁 Adicionais: ${upsellNames}\n💰 Total: R$ ${calculateTotal().toFixed(2)}`
      );
      
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    } else {
      // Without upsells, go directly to payment
      const link = KIRVANO_LINKS[selectedPlan.id];
      if (link) {
        window.open(link, '_blank');
      }
    }
  };

  const handleBack = () => {
    setShowUpsells(false);
    setSelectedPlan(null);
    setSelectedUpsells([]);
  };

  const getIcon = (planId: string) => {
    switch (planId) {
      case 'mensal': return planMensalIcon;
      case 'trimestral': return planTrimestralIcon;
      case 'anual': return planAnualIcon;
      default: return planMensalIcon;
    }
  };

  return (
    <section id="planos" className="py-20 px-4 bg-gradient-to-b from-cinema-dark via-cinema-dark/95 to-cinema-dark">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-cinema-red/20 text-cinema-red rounded-full text-sm font-bold mb-4">
            PLANOS EXCLUSIVOS
          </span>
          <h2 className="text-4xl md:text-5xl font-cinema font-bold text-white mb-4">
            Escolha seu <span className="text-cinema-red">Plano</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Acesso ilimitado a milhares de filmes, séries, animes e muito mais. 
            Cancele quando quiser.
          </p>
        </div>

        {/* Plans Grid or Upsell Selection */}
        {!showUpsells ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border transition-all duration-500 hover:scale-105 cursor-pointer",
                    plan.featured
                      ? "bg-gradient-to-b from-cinema-red/20 to-cinema-dark border-cinema-red shadow-glow"
                      : "bg-cinema-panel border-white/10 hover:border-cinema-red/50"
                  )}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {/* Featured badge */}
                  {plan.discount && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold",
                        plan.featured 
                          ? "bg-cinema-red text-white" 
                          : "bg-cinema-gold text-black"
                      )}>
                        {plan.discount}
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon and name */}
                    <div className="flex flex-col items-center mb-6">
                      <div className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden",
                        plan.featured 
                          ? "bg-cinema-red/20" 
                          : "bg-white/5"
                      )}>
                        <img 
                          src={getIcon(plan.id)} 
                          alt={plan.name} 
                          className="w-16 h-16 object-contain"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-white text-center">{plan.name}</h3>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-8">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-white/60 text-lg">R$</span>
                        <span className="text-5xl font-bold text-white">
                          {plan.price.toFixed(2).split('.')[0]}
                        </span>
                        <span className="text-white/60">,{plan.price.toFixed(2).split('.')[1]}</span>
                      </div>
                      <span className="text-white/50 text-sm">{plan.period}</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-cinema-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-cinema-red" />
                          </div>
                          <span className="text-white/80 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      className={cn(
                        "w-full py-4 rounded-xl font-bold transition-all duration-300",
                        plan.featured
                          ? "bg-cinema-red hover:bg-cinema-glow text-white shadow-glow hover:shadow-glow-lg"
                          : "bg-white/10 hover:bg-cinema-red text-white"
                      )}
                    >
                      Escolher Plano
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Upsell Selection */
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Selected Plan Summary */}
            <div className="bg-cinema-panel border border-cinema-red/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-cinema-red/20 flex items-center justify-center overflow-hidden">
                  <img 
                    src={getIcon(selectedPlan?.id || 'mensal')} 
                    alt={selectedPlan?.name} 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{selectedPlan?.name}</h3>
                  <p className="text-cinema-glow text-lg font-semibold">
                    R$ {selectedPlan?.price.toFixed(2)} <span className="text-white/50 text-sm">{selectedPlan?.period}</span>
                  </p>
                </div>
                <Check className="w-8 h-8 text-cinema-red" />
              </div>
            </div>

            {/* Upsells */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <Plus className="w-6 h-6 text-cinema-gold" />
                Turbine sua experiência! 🚀
              </h3>
              <p className="text-white/60 mb-6">Adicione extras exclusivos ao seu plano:</p>
              
              <div className="space-y-4">
                {upsells.map(upsell => (
                  <div
                    key={upsell.id}
                    className={cn(
                      "p-5 rounded-xl border cursor-pointer transition-all duration-300",
                      selectedUpsells.includes(upsell.id)
                        ? "bg-cinema-red/20 border-cinema-red"
                        : "bg-cinema-panel border-white/10 hover:border-cinema-red/50"
                    )}
                    onClick={() => toggleUpsell(upsell.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                        selectedUpsells.includes(upsell.id)
                          ? "bg-cinema-red border-cinema-red"
                          : "border-white/30"
                      )}>
                        {selectedUpsells.includes(upsell.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white">{upsell.name}</div>
                        <div className="text-sm text-white/60">{upsell.description}</div>
                      </div>
                      <span className="text-cinema-glow font-bold text-lg">
                        +R$ {upsell.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Actions */}
            <div className="bg-gradient-to-r from-cinema-panel to-cinema-dark border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-white/60 text-sm">Total</span>
                  <div className="text-3xl font-bold text-white">
                    R$ {calculateTotal().toFixed(2)}
                  </div>
                  {selectedUpsells.length > 0 && (
                    <span className="text-cinema-gold text-sm">
                      🎁 {selectedUpsells.length} adicional(is) selecionado(s)
                    </span>
                  )}
                </div>
                <ShoppingCart className="w-10 h-10 text-cinema-red" />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-4 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 py-4 rounded-xl font-bold bg-gradient-to-r from-cinema-red to-cinema-glow text-white shadow-glow hover:shadow-glow-lg transition-all hover:scale-105"
                >
                  {selectedUpsells.length > 0 ? '💬 Finalizar no WhatsApp' : '✅ Assinar Agora'}
                </button>
              </div>
            </div>

            {/* Skip upsells option */}
            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setSelectedUpsells([]);
                  handleCheckout();
                }}
                className="text-white/50 hover:text-white transition-colors text-sm underline"
              >
                Pular extras e ir direto pro pagamento
              </button>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/50 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Pagamento seguro
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Acesso imediato
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Suporte 24/7
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Cancele quando quiser
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
