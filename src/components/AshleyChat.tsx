import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Plan, Upsell } from '@/types';
import { plans, upsells, WHATSAPP_NUMBER, KIRVANO_LINKS } from '@/data/cineflix';
import { cn } from '@/lib/utils';

interface AshleyChatProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatStep = 'greeting' | 'name' | 'gender' | 'recommendations' | 'plans' | 'upsell' | 'checkout' | 'recovery';
type UserGender = 'male' | 'female' | null;

const MALE_RECOMMENDATIONS = [
  '🎬 **Ação e Adrenalina**: Filmes de tirar o fôlego com cenas explosivas!',
  '⚽ **Futebol ao Vivo**: Jogos da Champions League, Libertadores e mais!',
  '🦸 **Super-Heróis**: Marvel, DC e os maiores heróis do universo!',
  '🚗 **Velozes e Furiosos**: Toda a franquia em qualidade máxima!',
  '🎮 **Documentários Gaming**: E-sports e a história dos games!'
];

const FEMALE_RECOMMENDATIONS = [
  '🌸 **K-Dramas Exclusivos**: Os doramas mais assistidos do mundo!',
  '💕 **Séries Romance**: As histórias de amor mais emocionantes!',
  '👑 **Reality Shows**: BBB, casamentos, competições e muito mais!',
  '🎭 **Séries Dramáticas**: Grey\'s Anatomy, This Is Us e muito mais!',
  '✨ **Turcos e Mexicanos**: As novelas que todo mundo ama!'
];

const AshleyChat = ({ isOpen, onClose }: AshleyChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<ChatStep>('greeting');
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState<UserGender>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = useCallback((content: string, delay = 1500) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    }, delay);
  }, []);

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage('Olá! Sou Ashley da CineflixPayment! 👋', 500);
      setTimeout(() => {
        addBotMessage('Vou te ajudar a escolher o melhor plano para você! 🎬', 1000);
      }, 2000);
      setTimeout(() => {
        addBotMessage('Qual é o seu nome? 😊', 1000);
        setStep('name');
      }, 4000);
    }
  }, [isOpen, messages.length, addBotMessage]);

  const isValidName = (text: string): boolean => {
    const t = text.trim();
    if (t.length < 2 || t.length > 25) return false;
    if (/\d|[_@#$%^&*+=<>/\\|{}[\]~`]/.test(t)) return false;
    const bad = ['bot', 'robô', 'robo', 'teste', 'test', 'admin', 'null', 'undefined', 'system', 'xpto'];
    return !bad.includes(t.toLowerCase());
  };

  // Detect name patterns like "me chamo Lucas", "sou a Maria", "meu nome é João"
  const extractName = (text: string): string | null => {
    const patterns = [
      /(?:me\s+chamo|meu\s+nome\s+[eé]|sou\s+[oa]?\s*|[eé]\s+[oa]?\s*)([A-Za-zÀ-ÿ]+)/i,
      /^([A-Za-zÀ-ÿ]+)$/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && isValidName(match[1])) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
    }
    
    return null;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const text = input.trim();
    setInput('');
    addUserMessage(text);

    if (step === 'name') {
      const extractedName = extractName(text);
      if (extractedName) {
        setUserName(extractedName);
        setTimeout(() => {
          addBotMessage(`Prazer em te conhecer, ${extractedName}! 😊`, 800);
        }, 500);
        setTimeout(() => {
          addBotMessage('Pra eu te recomendar os melhores conteúdos, me conta: você é homem ou mulher? 🤔', 1000);
          setStep('gender');
        }, 2500);
      } else {
        setTimeout(() => {
          addBotMessage('Por favor, me diga seu nome para eu te chamar! 😊 Ex: "Me chamo Lucas" ou só "Maria"', 800);
        }, 500);
      }
    } else if (step === 'gender') {
      const lowerText = text.toLowerCase();
      const isMale = /\b(homem|masculino|macho|cara|ele|boy|men|man|sou\s+ele)\b/i.test(lowerText);
      const isFemale = /\b(mulher|feminino|f[eê]mea|mina|ela|garota|girl|woman|sou\s+ela)\b/i.test(lowerText);
      
      if (isMale) {
        setUserGender('male');
        showGenderRecommendations('male');
      } else if (isFemale) {
        setUserGender('female');
        showGenderRecommendations('female');
      } else {
        setTimeout(() => {
          addBotMessage('Me diz: você é homem ou mulher? Assim posso te recomendar o melhor conteúdo! 😊', 800);
        }, 500);
      }
    }
  };

  const showGenderRecommendations = (gender: 'male' | 'female') => {
    setStep('recommendations');
    const recommendations = gender === 'male' ? MALE_RECOMMENDATIONS : FEMALE_RECOMMENDATIONS;
    const intro = gender === 'male' 
      ? `Show, ${userName}! 💪 Preparei o melhor catálogo pra você!`
      : `Perfeito, ${userName}! 💖 Tenho o conteúdo ideal pra você!`;
    
    setTimeout(() => {
      addBotMessage(intro, 800);
    }, 500);

    setTimeout(() => {
      const recMessage = `
<div class="space-y-2 text-sm">
  ${recommendations.map(rec => `<div>${rec}</div>`).join('')}
</div>
      `;
      addBotMessage(recMessage, 1000);
    }, 2500);

    setTimeout(() => {
      addBotMessage('E tem muito mais! 🔥 Agora escolha seu plano para desbloquear tudo:', 1000);
      setStep('plans');
    }, 5000);
  };

  const handleSelectGender = (gender: 'male' | 'female') => {
    setUserGender(gender);
    addUserMessage(gender === 'male' ? 'Sou homem' : 'Sou mulher');
    showGenderRecommendations(gender);
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    addUserMessage(`Quero o ${plan.name}`);
    setTimeout(() => {
      addBotMessage(`Excelente escolha, ${userName}! O ${plan.name} é perfeito! 🎉`, 800);
    }, 500);
    setTimeout(() => {
      addBotMessage('Quer turbinar sua experiência com adicionais exclusivos? 🚀', 1000);
      setStep('upsell');
    }, 2500);
  };

  const toggleUpsell = (upsellId: string) => {
    setSelectedUpsells((prev) =>
      prev.includes(upsellId)
        ? prev.filter((id) => id !== upsellId)
        : [...prev, upsellId]
    );
  };

  const calculateTotal = (): number => {
    let total = selectedPlan?.price || 0;
    selectedUpsells.forEach((id) => {
      const upsell = upsells.find((u) => u.id === id);
      if (upsell) total += upsell.price;
    });
    return total;
  };

  const handleConfirmUpsells = () => {
    setStep('checkout');
    
    if (selectedUpsells.length > 0) {
      const planName = selectedPlan?.name || '';
      const upsellNames = selectedUpsells
        .map((id) => upsells.find((u) => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      const message = encodeURIComponent(
        `Olá! Vim pela Ashley. Quero comprar:\n📦 Plano: ${planName} - R$ ${selectedPlan?.price.toFixed(2)}\n🎁 Adicionais: ${upsellNames}\n💰 Total: R$ ${calculateTotal().toFixed(2)}`
      );
      
      addBotMessage(`Perfeito! Como você escolheu adicionais, vou te passar para o WhatsApp para atendimento VIP! 💬`, 800);
      
      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
      }, 2000);
    } else {
      addBotMessage(`🎉 Redirecionando para pagamento seguro...`, 800);
      
      setTimeout(() => {
        const link = KIRVANO_LINKS[selectedPlan?.id || 'mensal'];
        window.open(link, '_blank');
      }, 2000);
    }
  };

  // Exit intent detection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOpen && step !== 'checkout') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && isOpen && step === 'plans' && !selectedPlan) {
        addBotMessage(`Ei ${userName || 'amigo'}! Não vai embora! 😢 Tenho uma oferta especial só pra você! Use o cupom VOLTA10 para 10% OFF! 🎁`, 500);
        setStep('recovery');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isOpen, step, userName, selectedPlan, addBotMessage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md h-[85vh] max-h-[700px] bg-gradient-to-b from-cinema-panel to-cinema-dark rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cinema-red to-cinema-glow p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">CineflixPayment</h3>
            <p className="text-white/80 text-sm">Ashley — Assistente VIP</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-4 py-3 bg-black/30 border-b border-white/5">
          <div className="step-indicator justify-center">
            <div className={cn('step-dot', ['greeting', 'name'].includes(step) ? 'active' : 'completed')} />
            <div className={cn('step-dot', step === 'gender' ? 'active' : ['recommendations', 'plans', 'upsell', 'checkout'].includes(step) ? 'completed' : '')} />
            <div className={cn('step-dot', step === 'plans' || step === 'recommendations' ? 'active' : ['upsell', 'checkout'].includes(step) ? 'completed' : '')} />
            <div className={cn('step-dot', step === 'upsell' ? 'active' : step === 'checkout' ? 'completed' : '')} />
            <div className={cn('step-dot', step === 'checkout' ? 'active' : '')} />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('chat-bubble', msg.sender === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user')}
              dangerouslySetInnerHTML={{ __html: msg.content }}
            />
          ))}

          {/* Gender selection buttons */}
          {step === 'gender' && (
            <div className="flex gap-3 animate-slide-up">
              <button
                onClick={() => handleSelectGender('male')}
                className="flex-1 p-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-all"
              >
                <span className="text-3xl mb-2 block">👨</span>
                <span className="font-semibold text-white">Sou Homem</span>
              </button>
              <button
                onClick={() => handleSelectGender('female')}
                className="flex-1 p-4 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 transition-all"
              >
                <span className="text-3xl mb-2 block">👩</span>
                <span className="font-semibold text-white">Sou Mulher</span>
              </button>
            </div>
          )}

          {/* Plan selection */}
          {step === 'plans' && !selectedPlan && (
            <div className="space-y-3 animate-slide-up">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn('plan-card cursor-pointer', plan.featured && 'featured')}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {plan.discount && (
                    <span className="absolute top-2 right-2 text-xs font-bold text-cinema-red bg-cinema-red/20 px-2 py-1 rounded">
                      {plan.discount}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{plan.icon}</span>
                    <span className="font-bold">{plan.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-cinema-glow mb-2">
                    R$ {plan.price.toFixed(2)}
                    <span className="text-sm text-muted-foreground font-normal">{plan.period}</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-cinema-red" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Upsell selection */}
          {step === 'upsell' && (
            <div className="space-y-3 animate-slide-up">
              {upsells.map((upsell) => (
                <div
                  key={upsell.id}
                  className={cn('upsell-option', selectedUpsells.includes(upsell.id) && 'selected')}
                  onClick={() => toggleUpsell(upsell.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUpsells.includes(upsell.id)}
                    onChange={() => {}}
                    className="w-5 h-5 rounded border-white/20 bg-transparent text-cinema-red focus:ring-cinema-red"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{upsell.name}</div>
                    <div className="text-sm text-muted-foreground">{upsell.description}</div>
                  </div>
                  <span className="text-cinema-glow font-bold">R$ {upsell.price.toFixed(2)}</span>
                </div>
              ))}

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="text-2xl font-bold text-white">R$ {calculateTotal().toFixed(2)}</span>
                </div>
                <Button variant="cinema" size="lg" className="w-full" onClick={handleConfirmUpsells}>
                  ✅ CONFIRMAR ESCOLHAS
                </Button>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="chat-bubble chat-bubble-bot w-20">
              <div className="flex gap-1.5">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(step === 'name' || step === 'gender' || step === 'recovery') && (
          <div className="p-4 border-t border-white/5 bg-black/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={step === 'name' ? 'Ex: Me chamo Lucas...' : step === 'gender' ? 'Homem ou Mulher?' : 'Sua resposta...'}
                className="flex-1 bg-cinema-dark border-white/10 focus:border-cinema-red"
              />
              <Button variant="cinema" size="icon" onClick={handleSend}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AshleyChat;
