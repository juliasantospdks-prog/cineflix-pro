import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Plan, Upsell } from '@/types';
import { plans, upsells, WHATSAPP_NUMBER, KIRVANO_LINKS } from '@/data/cineflix';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AshleyChatProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatStep = 'greeting' | 'name' | 'gender' | 'recommendations' | 'plans' | 'upsell' | 'checkout' | 'recovery' | 'freeChat';
type UserGender = 'male' | 'female' | null;

const MALE_RECOMMENDATIONS = [
  '🎬 **Ação e Adrenalina**: Filmes de tirar o fôlego!',
  '⚽ **Futebol ao Vivo**: Champions, Libertadores e mais!',
  '🦸 **Super-Heróis**: Marvel, DC e os maiores heróis!',
  '🚗 **Velozes e Furiosos**: Toda a franquia em 4K!',
];

const FEMALE_RECOMMENDATIONS = [
  '🌸 **K-Dramas**: Os doramas mais assistidos!',
  '💕 **Séries Romance**: Histórias de amor emocionantes!',
  '👑 **Reality Shows**: BBB, casamentos e mais!',
  '✨ **Novelas Turkas**: As novelas que todo mundo ama!',
];

const TYPING_DELAY = 3000; // 3 seconds typing indicator
const MESSAGE_INTERVAL = 5000; // 5 seconds between auto messages

const AshleyChat = ({ isOpen, onClose }: AshleyChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<ChatStep>('greeting');
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState<UserGender>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageQueueRef = useRef<string[]>([]);
  const processingQueueRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Process message queue with delays
  const processMessageQueue = useCallback(async () => {
    if (processingQueueRef.current || messageQueueRef.current.length === 0) return;
    
    processingQueueRef.current = true;
    
    while (messageQueueRef.current.length > 0) {
      const content = messageQueueRef.current.shift()!;
      
      // Show typing indicator
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, TYPING_DELAY));
      
      // Add message
      setIsTyping(false);
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setConversationHistory(prev => [...prev, { role: 'assistant', content }]);
      
      // Wait before next message
      if (messageQueueRef.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    processingQueueRef.current = false;
  }, []);

  const addBotMessage = useCallback((content: string) => {
    messageQueueRef.current.push(content);
    processMessageQueue();
  }, [processMessageQueue]);

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setConversationHistory(prev => [...prev, { role: 'user', content }]);
  };

  // Get AI response
  const getAIResponse = async (userMessage: string) => {
    setIsAiLoading(true);
    setIsTyping(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ashley-chat', {
        body: {
          userMessage,
          userName,
          userGender,
          conversationHistory,
          step
        }
      });

      if (error) throw error;
      
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, TYPING_DELAY));
      
      setIsTyping(false);
      const response = data?.response || 'Me conta mais sobre o que você procura!';
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: response }]);
      
    } catch (error) {
      console.error('AI response error:', error);
      setIsTyping(false);
      addBotMessage('Oi! Me conta o que você tá buscando que eu te ajudo! 😊');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Initial greeting sequence
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const startSequence = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        addBotMessage('Olá! Sou Ashley da CineflixPayment! 👋');
        
        await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL));
        addBotMessage('Vou te ajudar a escolher o melhor plano pra você! 🎬');
        
        await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL));
        addBotMessage('Qual é o seu nome? 😊');
        setStep('name');
      };
      startSequence();
    }
  }, [isOpen, messages.length, addBotMessage]);

  const isValidName = (text: string): boolean => {
    const t = text.trim();
    if (t.length < 2 || t.length > 25) return false;
    if (/\d|[_@#$%^&*+=<>/\\|{}[\]~`]/.test(t)) return false;
    const bad = ['bot', 'robô', 'robo', 'teste', 'test', 'admin', 'null', 'undefined'];
    return !bad.includes(t.toLowerCase());
  };

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

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return;
    
    const text = input.trim();
    setInput('');
    addUserMessage(text);

    if (step === 'name') {
      const extractedName = extractName(text);
      if (extractedName) {
        setUserName(extractedName);
        await new Promise(resolve => setTimeout(resolve, 1000));
        addBotMessage(`Prazer em te conhecer, ${extractedName}! 😊`);
        await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL));
        addBotMessage('Pra eu te recomendar os melhores conteúdos: você é homem ou mulher? 🤔');
        setStep('gender');
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        addBotMessage('Por favor, me diga seu nome! Ex: "Me chamo Lucas" ou só "Maria"');
      }
    } else if (step === 'gender') {
      const lowerText = text.toLowerCase();
      const isMale = /\b(homem|masculino|ele|cara|boy|man)\b/i.test(lowerText);
      const isFemale = /\b(mulher|feminino|ela|mina|girl|woman)\b/i.test(lowerText);
      
      if (isMale) {
        setUserGender('male');
        showGenderRecommendations('male');
      } else if (isFemale) {
        setUserGender('female');
        showGenderRecommendations('female');
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        addBotMessage('Me diz: você é homem ou mulher? 😊');
      }
    } else if (step === 'freeChat' || step === 'recommendations' || step === 'plans') {
      // Use AI for free conversation
      await getAIResponse(text);
    }
  };

  const showGenderRecommendations = async (gender: 'male' | 'female') => {
    setStep('recommendations');
    const recommendations = gender === 'male' ? MALE_RECOMMENDATIONS : FEMALE_RECOMMENDATIONS;
    const intro = gender === 'male' 
      ? `Show, ${userName}! 💪 Olha o catálogo que eu separei pra você:`
      : `Perfeito, ${userName}! 💖 Preparei o conteúdo ideal pra você:`;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addBotMessage(intro);
    
    await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL));
    const recMessage = `<div class="space-y-2 text-sm">${recommendations.map(rec => `<div>${rec}</div>`).join('')}</div>`;
    addBotMessage(recMessage);
    
    await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL));
    addBotMessage('E tem muito mais! 🔥 Escolha seu plano abaixo pra desbloquear tudo:');
    setStep('plans');
  };

  const handleSelectGender = (gender: 'male' | 'female') => {
    setUserGender(gender);
    addUserMessage(gender === 'male' ? 'Sou homem' : 'Sou mulher');
    showGenderRecommendations(gender);
  };

  const handleSelectPlan = async (plan: Plan) => {
    setSelectedPlan(plan);
    addUserMessage(`Quero o ${plan.name}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    addBotMessage(`Excelente escolha, ${userName}! O ${plan.name} é perfeito! 🎉`);
    await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL));
    addBotMessage('Quer turbinar sua experiência com adicionais exclusivos? 🚀');
    setStep('upsell');
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

  const handleConfirmUpsells = () => {
    setStep('checkout');
    
    if (selectedUpsells.length > 0) {
      const planName = selectedPlan?.name || '';
      const upsellNames = selectedUpsells
        .map(id => upsells.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      const message = encodeURIComponent(
        `Olá! Vim pela Ashley. Quero comprar:\n📦 Plano: ${planName} - R$ ${selectedPlan?.price.toFixed(2)}\n🎁 Adicionais: ${upsellNames}\n💰 Total: R$ ${calculateTotal().toFixed(2)}`
      );
      
      addBotMessage('Perfeito! Vou te passar pro WhatsApp pra atendimento VIP! 💬');
      
      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
      }, 3000);
    } else {
      addBotMessage('🎉 Redirecionando pro pagamento seguro...');
      
      setTimeout(() => {
        const link = KIRVANO_LINKS[selectedPlan?.id || 'mensal'];
        window.open(link, '_blank');
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md h-[85vh] max-h-[700px] bg-gradient-to-b from-cinema-panel to-cinema-dark rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/5 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cinema-red to-cinema-glow p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">CineflixPayment</h3>
            <p className="text-white/80 text-sm flex items-center gap-2">
              Ashley — Assistente VIP
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[85%] p-3 rounded-2xl animate-fade-in',
                msg.sender === 'bot' 
                  ? 'bg-cinema-panel text-white rounded-bl-none' 
                  : 'bg-cinema-red text-white ml-auto rounded-br-none'
              )}
              dangerouslySetInnerHTML={{ __html: msg.content }}
            />
          ))}

          {/* Gender selection buttons */}
          {step === 'gender' && !isTyping && (
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
          {step === 'plans' && !selectedPlan && !isTyping && (
            <div className="space-y-3 animate-slide-up">
              {plans.map(plan => (
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
          {step === 'upsell' && !isTyping && (
            <div className="space-y-3 animate-slide-up">
              {upsells.map(upsell => (
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
            <div className="max-w-[85%] p-4 rounded-2xl bg-cinema-panel rounded-bl-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-white/50 text-sm ml-2">Ashley está escrevendo...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(step === 'name' || step === 'gender' || step === 'recovery' || step === 'freeChat' || step === 'plans') && (
          <div className="p-4 border-t border-white/5 bg-black/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder={
                  step === 'name' ? 'Ex: Me chamo Lucas...' : 
                  step === 'gender' ? 'Homem ou Mulher?' : 
                  'Digite sua mensagem...'
                }
                className="flex-1 bg-cinema-dark border-white/10 focus:border-cinema-red"
                disabled={isTyping || isAiLoading}
              />
              <Button 
                variant="cinema" 
                size="icon" 
                onClick={handleSend}
                disabled={isTyping || isAiLoading}
              >
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
