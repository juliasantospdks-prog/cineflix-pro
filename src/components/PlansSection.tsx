import { Check } from 'lucide-react';
import { plans } from '@/data/cineflix';
import { cn } from '@/lib/utils';
import { Plan } from '@/types';
import planMensalIcon from '@/assets/plan-mensal-icon.png';
import planTrimestralIcon from '@/assets/plan-trimestral-icon.png';
import planAnualIcon from '@/assets/plan-anual-icon.png';

interface PlansSectionProps {
  onOpenChatWithPlan?: (message?: string) => void;
}

const PlansSection = ({ onOpenChatWithPlan }: PlansSectionProps) => {
  const handleSelectPlan = (plan: Plan) => {
    const confirmationMessage = `Você tomou uma ótima decisão escolhendo o ${plan.name}! 🎉 Abaixo você vai seguir para o próximo passo para ter acesso a todo nosso catálogo... Deus abençoe! 🙏`;
    onOpenChatWithPlan?.(confirmationMessage);
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

        {/* Plans Grid */}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan);
                  }}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold transition-all duration-300",
                    plan.featured
                      ? "bg-cinema-red hover:bg-cinema-glow text-white shadow-glow hover:shadow-glow-lg"
                      : "bg-white/10 hover:bg-cinema-red text-white"
                  )}
                >
                  Assinar Agora
                </button>
              </div>
            </div>
          ))}
        </div>

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