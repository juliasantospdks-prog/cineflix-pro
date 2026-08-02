import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Plus, Minus, User2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { plans, upsells, WHATSAPP_NUMBER, KIRVANO_LINKS } from '@/data/cineflix';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Plan, Upsell } from '@/types';
import { analytics } from '@/lib/analytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import planMensalIcon from '@/assets/plan-mensal-new.png';
import planTrimestralIcon from '@/assets/plan-trimestral-new.png';
import planAnualIcon from '@/assets/plan-anual-new.png';
import planApkIcon from '@/assets/plan-apk-icon.png';


interface PlansSectionProps {
  onOpenChatWithPlan?: (message?: string) => void;
}

const PlansSection = ({ onOpenChatWithPlan }: PlansSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [showUpsells, setShowUpsells] = useState(false);
  const [askName, setAskName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setSelectedUpsells([]);
    setShowUpsells(true);
    analytics.viewContent(plan.id, plan.name, plan.price);
  };

  const COMBO_ID = 'combo_completo';
  const toggleUpsell = (upsellId: string) => {
    setSelectedUpsells(prev => {
      const isSelected = prev.includes(upsellId);
      // Se clicou no COMBO: alterna apenas o combo e remove todos os outros
      if (upsellId === COMBO_ID) {
        return isSelected ? [] : [COMBO_ID];
      }
      // Se clicou em outro item: remove o combo automaticamente
      const withoutCombo = prev.filter(id => id !== COMBO_ID);
      return isSelected
        ? withoutCombo.filter(id => id !== upsellId)
        : [...withoutCombo, upsellId];
    });
  };

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    const upsellTotal = selectedUpsells.reduce((total, id) => {
      const upsell = upsells.find(u => u.id === id);
      return total + (upsell?.price || 0);
    }, 0);
    return selectedPlan.price + upsellTotal;
  };

  const proceedToReceipt = (nome: string) => {
    if (!selectedPlan) return;
    const email = user?.email || '';
    const upsellParam = selectedUpsells.length > 0 ? `&upsells=${selectedUpsells.join(',')}` : '';
    analytics.beginCheckout(selectedPlan.id, selectedPlan.name, calculateTotal());
    navigate(`/comprovante?plano=${selectedPlan.id}&nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}${upsellParam}`);

    const confirmationMessage = `Você tomou uma ótima decisão escolhendo o ${selectedPlan.name}, ${nome}! 🎉 Abaixo você vai seguir para o próximo passo para ter acesso a todo nosso catálogo... Deus abençoe! 🙏`;
    onOpenChatWithPlan?.(confirmationMessage);

    setShowUpsells(false);
    setSelectedPlan(null);
    setSelectedUpsells([]);
  };

  const handleCheckout = () => {
    if (!selectedPlan) return;

    const knownName = user?.user_metadata?.full_name || '';
    if (knownName && knownName.trim().length >= 2) {
      proceedToReceipt(knownName.trim());
      return;
    }
    // Usuário não logado / sem nome — abre popup pra capturar
    setTempName('');
    setNameError('');
    setAskName(true);
  };

  const confirmNameAndCheckout = () => {
    const n = tempName.trim();
    if (n.length < 2) {
      setNameError('Digite seu nome completo (mínimo 2 letras).');
      return;
    }
    if (/\d|[_@#$%^&*+=<>/\\|{}[\]~`]/.test(n)) {
      setNameError('Use apenas letras e espaços.');
      return;
    }
    setAskName(false);
    proceedToReceipt(n);
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
      case 'apk': return planApkIcon;
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
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
                    <img 
                      src={getIcon(selectedPlan.id)} 
                      alt={selectedPlan.name} 
                      className="w-16 h-16 object-contain"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  Finalizar plano
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch justify-items-center max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="relative w-full max-w-sm h-full flex flex-col rounded-2xl border transition-all duration-500 hover:scale-[1.03] cursor-pointer bg-gradient-to-b from-cinema-red/20 via-cinema-panel to-cinema-dark border-cinema-red/60 hover:border-cinema-red shadow-lg hover:shadow-glow overflow-hidden group"
                onClick={() => handleSelectPlan(plan)}
              >
                {/* Featured badge */}
                {plan.discount && (
                  <div className="absolute top-0 left-0 right-0 z-10">
                    <div className="bg-cinema-red text-white text-xs font-bold text-center py-1.5 tracking-wider">
                      {plan.discount}
                    </div>
                  </div>
                )}

                <div className={cn("p-6 flex flex-col flex-1 w-full", plan.discount && "pt-10")}>
                  {/* Icon and name */}
                  <div className="flex flex-col items-center mb-5">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3 overflow-hidden">
                      <img 
                        src={getIcon(plan.id)} 
                        alt={plan.name} 
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                    <h3 className="text-base font-bold text-white text-center leading-tight">{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-5">
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-white/60 text-sm">R$</span>
                      <span className="text-4xl font-bold text-white">
                        {plan.price.toFixed(2).split('.')[0]}
                      </span>
                      <span className="text-white/60 text-sm">,{plan.price.toFixed(2).split('.')[1]}</span>
                    </div>
                    <span className="text-white/50 text-xs">{plan.period}</span>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-white/10 mb-5" />

                  {/* Features */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-cinema-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-cinema-red" />
                        </div>
                        <span className="text-white/70 text-sm leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan);
                    }}
                    className="w-full mt-auto py-3.5 rounded-xl text-sm font-bold transition-all duration-300 bg-cinema-red hover:bg-cinema-glow text-white shadow-glow hover:shadow-glow-lg"
                  >
                    {plan.id === 'apk' ? '🤖 Comprar APK' : '🎬 Assinar Agora'}
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
      {/* Pop-up para capturar nome quando o usuário não está logado */}
      <Dialog open={askName} onOpenChange={setAskName}>
        <DialogContent className="bg-cinema-panel border border-cinema-red/40 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <User2 className="w-5 h-5 text-cinema-red" />
              Antes de gerar seu comprovante
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Digite seu <span className="text-cinema-red font-semibold">nome completo</span> para aparecer no comprovante oficial do seu pedido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Input
              autoFocus
              value={tempName}
              onChange={(e) => { setTempName(e.target.value); if (nameError) setNameError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmNameAndCheckout(); } }}
              placeholder="Ex: Maria Silva"
              maxLength={60}
              className="bg-cinema-dark border-white/15 focus:border-cinema-red text-white placeholder:text-white/40"
            />
            {nameError && <p className="text-red-400 text-xs">{nameError}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAskName(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmNameAndCheckout}
                className="flex-1 py-2.5 rounded-lg bg-cinema-red hover:bg-cinema-glow text-white text-sm font-bold shadow-glow transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PlansSection;
