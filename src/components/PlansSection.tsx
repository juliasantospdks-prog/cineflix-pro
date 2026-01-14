import { useState } from 'react';
import { Check, ArrowLeft, Plus, Minus } from 'lucide-react';
import { plans, upsells, WHATSAPP_NUMBER, KIRVANO_LINKS } from '@/data/cineflix';
import { cn } from '@/lib/utils';
import { Plan, Upsell } from '@/types';
import planMensalIcon from '@/assets/plan-mensal-icon.png';
import planTrimestralIcon from '@/assets/plan-trimestral-icon.png';
import planAnualIcon from '@/assets/plan-anual-icon.png';

interface PlansSectionProps {
  onOpenChatWithPlan?: (message?: string) => void;
}

const PlansSection = ({ onOpenChatWithPlan }: PlansSectionProps) => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [showUpsells, setShowUpsells] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setSelectedUpsells([]);
    setShowUpsells(true);
  };

  const toggleUpsell = (upsellId: string) => {
    setSelectedUpsells(prev => 
      prev.includes(upsellId) 
        ? prev.filter(id => id !== upsellId)
        : [...prev, upsellId]
    );
  };

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    const upsellTotal = selectedUpsells.reduce((total, id) => {
      const upsell = upsells.find(u => u.id === id);
      return total + (upsell?.price || 0);
    }, 0);
    return selectedPlan.price + upsellTotal;
  };

  const handleCheckout = () => {
    if (!selectedPlan) return;
    
    if (selectedUpsells.length > 0) {
      // Com upsells -> WhatsApp VIP
      const selectedUpsellNames = selectedUpsells
        .map(id => upsells.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      const message = `Olá! Quero assinar o ${selectedPlan.name} + ${selectedUpsellNames}. Total: R$ ${calculateTotal().toFixed(2)}`;
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      // Sem upsells -> Kirvano direto
      const kirvanoLink = KIRVANO_LINKS[selectedPlan.id];
      if (kirvanoLink) {
        window.open(kirvanoLink, '_blank');
      }
    }
    
    // Abrir chat com mensagem de confirmação
    const confirmationMessage = `Você tomou uma ótima decisão escolhendo o ${selectedPlan.name}! 🎉 Abaixo você vai seguir para o próximo passo para ter acesso a todo nosso catálogo... Deus abençoe! 🙏`;
    onOpenChatWithPlan?.(confirmationMessage);
    
    // Reset state
    setShowUpsells(false);
    setSelectedPlan(null);
    setSelectedUpsells([]);
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

        {/* Upsells Section - Shows after plan selection */}
        {showUpsells && selectedPlan && (
          <div className="mb-12 animate-fade-in">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar aos planos
            </button>

            {/* Selected Plan Summary */}
            <div className="bg-cinema-panel border border-cinema-red/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-cinema-red/20 flex items-center justify-center overflow-hidden">
                    <img 
                      src={getIcon(selectedPlan.id)} 
                      alt={selectedPlan.name} 
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPlan.name}</h3>
                    <p className="text-cinema-red font-bold">R$ {selectedPlan.price.toFixed(2)} {selectedPlan.period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-white/60 text-sm">Plano selecionado</span>
                  <div className="text-green-500 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Confirmado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upsells Grid */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">🎁 Ofertas Exclusivas</h3>
              <p className="text-white/60 mb-6">Adicione extras ao seu plano com desconto especial!</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upsells.map((upsell) => {
                  const isSelected = selectedUpsells.includes(upsell.id);
                  return (
                    <div
                      key={upsell.id}
                      onClick={() => toggleUpsell(upsell.id)}
                      className={cn(
                        "relative rounded-xl border p-5 cursor-pointer transition-all duration-300 hover:scale-102",
                        isSelected
                          ? "bg-cinema-red/20 border-cinema-red shadow-glow"
                          : "bg-cinema-panel border-white/10 hover:border-cinema-red/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-white">{upsell.name}</h4>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                          isSelected ? "bg-cinema-red" : "bg-white/10"
                        )}>
                          {isSelected ? (
                            <Minus className="w-4 h-4 text-white" />
                          ) : (
                            <Plus className="w-4 h-4 text-white/60" />
                          )}
                        </div>
                      </div>
                      <p className="text-white/60 text-sm mb-3">{upsell.description}</p>
                      <p className="text-cinema-gold font-bold">+R$ {upsell.price.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total and Checkout */}
            <div className="bg-gradient-to-r from-cinema-red/20 to-cinema-panel border border-cinema-red/30 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                  <span className="text-white/60">Total a pagar:</span>
                  <div className="text-3xl font-bold text-white">
                    R$ {calculateTotal().toFixed(2)}
                  </div>
                </div>
                {selectedUpsells.length > 0 && (
                  <div className="text-cinema-gold text-sm">
                    ✨ {selectedUpsells.length} extra(s) adicionado(s)
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCheckout}
                  className="flex-1 py-4 rounded-xl font-bold bg-cinema-red hover:bg-cinema-glow text-white shadow-glow hover:shadow-glow-lg transition-all duration-300"
                >
                  {selectedUpsells.length > 0 ? '🎯 Finalizar via WhatsApp VIP' : '💳 Seguir para pagamento'}
                </button>
                <button
                  onClick={() => {
                    setSelectedUpsells([]);
                    handleCheckout();
                  }}
                  className="py-4 px-6 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                >
                  Pular ofertas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid - Hidden when showing upsells */}
        {!showUpsells && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="relative rounded-2xl border transition-all duration-500 hover:scale-105 cursor-pointer bg-gradient-to-b from-cinema-red/20 to-cinema-dark border-cinema-red shadow-glow"
                onClick={() => handleSelectPlan(plan)}
              >
                {/* Featured badge */}
                {plan.discount && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-cinema-red text-white">
                      {plan.discount}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon and name */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden bg-cinema-red/20">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan);
                    }}
                    className="w-full py-4 rounded-xl font-bold transition-all duration-300 bg-cinema-red hover:bg-cinema-glow text-white shadow-glow hover:shadow-glow-lg"
                  >
                    Assinar Agora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trust badges */}
        {!showUpsells && (
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
        )}
      </div>
    </section>
  );
};

export default PlansSection;
