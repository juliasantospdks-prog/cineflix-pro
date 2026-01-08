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

type ChatStep = 'greeting' | 'name' | 'plans' | 'upsell' | 'checkout' | 'recovery';

const AshleyChat = ({ isOpen, onClose }: AshleyChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<ChatStep>('greeting');
  const [userName, setUserName] = useState('');
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

  const handleSend = () => {
    if (!input.trim()) return;
    
    const text = input.trim();
    setInput('');
    addUserMessage(text);

    if (step === 'name' && isValidName(text)) {
      setUserName(text);
      setTimeout(() => {
        addBotMessage(`Prazer em te conhecer, ${text}! 😊`, 800);
      }, 500);
      setTimeout(() => {
        addBotMessage('Vou te mostrar nossos planos incríveis. Escolha o melhor para você! 🎯', 1000);
        setStep('plans');
      }, 2500);
    } else if (step === 'name') {
      setTimeout(() => {
        addBotMessage('Por favor, me diga seu nome para eu te chamar! 😊', 800);
      }, 500);
    }
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
      // Redirect to WhatsApp for upsells
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
      // Redirect to Kirvano for direct payment
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
            <div className={cn('step-dot', step === 'greeting' || step === 'name' ? 'active' : 'completed')} />
            <div className={cn('step-dot', step === 'plans' ? 'active' : step === 'upsell' || step === 'checkout' ? 'completed' : '')} />
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
        {(step === 'name' || step === 'recovery') && (
          <div className="p-4 border-t border-white/5 bg-black/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Seu nome ou resposta..."
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
