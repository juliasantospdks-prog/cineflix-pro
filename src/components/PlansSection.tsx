import { Check, Smartphone } from 'lucide-react';
import { plans, KIRVANO_LINKS } from '@/data/cineflix';
import avatarMain from '@/assets/avatar-main.jpg';

interface PlansSectionProps {
  onOpenChatWithPlan?: (message?: string) => void;
}

const PlansSection = ({ onOpenChatWithPlan }: PlansSectionProps) => {
  const plan = plans[0];

  const handleDirectPurchase = () => {
    const kirvanoLink = KIRVANO_LINKS[plan.id];
    if (kirvanoLink) {
      window.open(kirvanoLink, '_blank');
    }
    const confirmationMessage = `Você tomou uma ótima decisão escolhendo o ${plan.name}! 🎉 Abaixo você vai seguir para o próximo passo para ter acesso a todo nosso catálogo... Deus abençoe! 🙏`;
    onOpenChatWithPlan?.(confirmationMessage);
  };

  return (
    <section id="planos" className="py-20 px-4 bg-gradient-to-b from-cinema-dark via-cinema-dark/95 to-cinema-dark">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-cinema-red/20 text-cinema-red rounded-full text-sm font-bold mb-4">
            OFERTA EXCLUSIVA
          </span>
          <h2 className="text-4xl md:text-5xl font-cinema font-bold text-white mb-4">
            App <span className="text-cinema-red">Vitalício</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Pague uma vez e tenha acesso vitalício a todo nosso catálogo de filmes e séries. 
            Exclusivo para dispositivos Android.
          </p>
        </div>

        {/* Main Card with Avatar */}
        <div className="relative rounded-3xl border-2 border-cinema-red bg-gradient-to-b from-cinema-red/30 via-cinema-dark to-cinema-dark shadow-glow overflow-hidden">
          {/* Badge */}
          <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2">
            <span className="px-6 py-2 rounded-b-xl text-sm font-bold bg-cinema-red text-white">
              🔥 ACESSO VITALÍCIO
            </span>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-cinema-red shadow-glow overflow-hidden">
                  <img 
                    src={avatarMain} 
                    alt="Avatar CineflixPayment" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Plan Details */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                  <Smartphone className="w-5 h-5 text-cinema-gold" />
                  <span className="text-cinema-gold font-medium">Somente Android</span>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <span className="text-white/60 text-2xl">R$</span>
                    <span className="text-6xl md:text-7xl font-bold text-white">49</span>
                    <span className="text-white/60 text-2xl">,90</span>
                  </div>
                  <span className="text-cinema-gold font-bold text-lg">VALOR ÚNICO • PAGUE UMA VEZ</span>
                </div>

                {/* Features */}
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-cinema-red/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-cinema-red" />
                      </div>
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={handleDirectPurchase}
                  className="w-full md:w-auto px-12 py-5 rounded-xl font-bold text-lg transition-all duration-300 bg-cinema-red hover:bg-cinema-glow text-white shadow-glow hover:shadow-glow-lg hover:scale-105"
                >
                  🚀 Comprar Agora - R$ 49,90
                </button>
              </div>
            </div>
          </div>
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
            Acesso vitalício
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
