import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X, Check, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Plan } from '@/types';
import { plans, upsells } from '@/data/cineflix';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import cineflixLogo from '@/assets/cineflix-logo.png';
import ashleyAvatar from '@/assets/ashley-avatar.png.asset.json';
import ashleyGreeting from '@/assets/ashley-greeting.mp3.asset.json';
import ashleyQuerido from '@/assets/ashley-querido.mp3.asset.json';
import ashleyQuerida from '@/assets/ashley-querida.mp3.asset.json';

interface AshleyChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

type ChatStep = 'greeting' | 'name' | 'gender' | 'recommendations' | 'plans' | 'upsell' | 'checkout' | 'recovery' | 'freeChat';
type UserGender = 'male' | 'female' | null;

const TYPING_DELAY = 8000;
const MESSAGE_INTERVAL = 400;
const MAX_INPUT_LEN = 500;

// Descrições persuasivas de cada plano (Ashley apresenta um por vez)
const PLAN_PITCHES: Record<string, string> = {
  mensal:
    'Vamos começar pelo Plano Mensal 📱 Por apenas R$ 29,90 você tem 30 dias de acesso completo ao catálogo inteiro — filmes, séries, animes e futebol ao vivo, em Full HD, liberado na hora. Perfeito pra testar sem compromisso. 🎬',
  trimestral:
    'Agora o Plano Trimestral 💎 São 90 dias por R$ 75,90 — você ECONOMIZA 20% em relação ao mensal, ganha 2 telas simultâneas, qualidade 4K Ultra HD e download offline pra assistir onde quiser. 🚀',
  anual:
    'A MELHOR OFERTA: Plano Anual VIP 👑 R$ 300,00 por 365 dias, 4 telas simultâneas, 4K Ultra HD, downloads ilimitados e acesso antecipado a lançamentos. Sai por menos de R$ 0,83 por dia. ⭐',
  apk:
    'E pra fechar: APK Vitalício 🤖 Pagamento ÚNICO de R$ 97,90 — nunca mais paga mensalidade! Roda em Android, sem senhas, sem travamentos, zero anúncios, atualizações incluídas e garantia de 360 dias. 🔥',
};

const PLAN_ORDER = ['mensal', 'trimestral', 'anual', 'apk'];

// Generate a unique message id (avoids collisions on fast sequential adds)
let __msgSeq = 0;
const uid = () => `m_${Date.now()}_${++__msgSeq}_${Math.random().toString(36).slice(2, 7)}`;

// Strip Markdown from AI responses
const cleanAIResponse = (text: string): string => {
  return (text || '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^[-•●▪]\s*/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}/g, '')
    .trim();
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Name → gender dictionary (Brazilian common names). Returns null when ambiguous.
const MALE_NAMES = new Set([
  'lucas','joao','joão','pedro','miguel','gabriel','arthur','davi','david','bernardo','heitor','theo','enzo','lorenzo',
  'matheus','mateus','nicolas','nicholas','samuel','rafael','vitor','victor','leonardo','leo','gustavo','henrique',
  'felipe','filipe','daniel','andre','andré','carlos','paulo','marcos','marcelo','rodrigo','ricardo','eduardo','duda',
  'fernando','bruno','thiago','tiago','alexandre','antonio','antônio','hemerson','francisco','chico','jose','josé',
  'luiz','luis','luís','sergio','sérgio','jorge','fabio','fábio','diego','douglas','igor','isaac','joaquim','julio',
  'júlio','mario','mário','mauro','otavio','otávio','pablo','renan','ruan','sandro','vinicius','vinícius','wesley',
  'william','yuri','hugo','ian','juan','kauã','kauan','kaique','levi','murilo','noah','ravi','raul','vicente',
  'caio','breno','arnaldo','elias','edson','adriano','alan','alex','alvaro','álvaro','benicio','benício','cesar','césar',
  'cristiano','cristian','danilo','everton','emerson','erick','erik','fabricio','fabrício','geraldo','gilberto',
  'guilherme','heron','italo','ítalo','ivan','jeferson','jefferson','joel','jonas','julian','kaio','kayo','leandro',
  'lincoln','lucca','luca','marcio','márcio','marlon','martin','mateo','natanael','nelson','otto','oscar','óscar',
  'patrick','rafa','renato','reinaldo','robson','romario','romário','sebastian','silas','tales','vagner','wagner',
  'walter','washington','wellington','yago','iago','iuri','dante','dener','denis','dênis','flavio','flávio'
]);

const FEMALE_NAMES = new Set([
  'julia','júlia','juliana','maria','ana','sofia','sophia','alice','laura','isabella','isabela','manuela','helena',
  'valentina','lorena','livia','lívia','beatriz','bia','mariana','gabriela','rafaela','larissa','jessica','jéssica',
  'fernanda','camila','amanda','leticia','letícia','vanessa','patricia','patrícia','sandra','claudia','cláudia',
  'monica','mônica','carla','daniela','raquel','renata','debora','débora','eduarda','heloisa','heloísa','joana','lara',
  'lavinia','lavínia','luiza','luísa','melissa','nicole','olivia','olívia','pietra','sarah','sara','tatiana','yasmin',
  'agatha','ágata','alicia','alícia','antonella','aurora','bianca','bruna','cecilia','cecília','clara','elisa','emily',
  'esther','ester','gabrielly','giovanna','isadora','lais','laís','marcela','marina','milena','miriam','nayara','paula',
  'priscila','regina','rebeca','simone','stella','vitoria','vitória','vivian','hannah','hadassa','ingrid','iris','íris',
  'kelly','kethelyn','laisa','laisla','lais','liz','lorraine','lucia','lúcia','luana','lis','marta','marcia','márcia',
  'monique','natalia','natália','nathalia','natasha','rita','rosa','rose','rosana','sabrina','samira','sheila','silvia',
  'sílvia','sofia','soraia','suelen','suzana','tais','taís','talita','tamires','tatiane','teresa','vera','virginia',
  'virgínia','viviane','wanda','zilda','elis','eloah','eloá','aline','andrea','andréa','angela','ângela','carolina','carol'
]);

const guessGenderFromName = (name: string): 'male' | 'female' | null => {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  if (MALE_NAMES.has(n)) return 'male';
  if (FEMALE_NAMES.has(n)) return 'female';
  // Heuristic fallback: most PT-BR names ending in "a" are feminine, in "o" or consonant masculine.
  const last = n.slice(-1);
  const last2 = n.slice(-2);
  if (['a','á'].includes(last) && !['joshua','luca','elias','jonas'].includes(n)) return 'female';
  if (['o','ó'].includes(last)) return 'male';
  if (['el','er','as','os','im','om','um','ir','or','ur','ez','iz','az','uz'].includes(last2)) return 'male';
  return null;
};

const AshleyChat = ({ isOpen, onClose, initialMessage }: AshleyChatProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<ChatStep>('greeting');
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState<UserGender>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [planPresentIndex, setPlanPresentIndex] = useState(0);
  const [planPitchDone, setPlanPitchDone] = useState(false);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageQueueRef = useRef<string[]>([]);
  const processingQueueRef = useRef(false);
  const hasStartedRef = useRef(false); // Prevents double-greeting (StrictMode / re-opens)
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Sequential queue → preserves order, prevents duplicates
  const processMessageQueue = useCallback(async () => {
    if (processingQueueRef.current) return;
    processingQueueRef.current = true;

    try {
      while (messageQueueRef.current.length > 0) {
        const content = messageQueueRef.current.shift()!;
        if (!isMountedRef.current) break;

        setIsTyping(true);
        await sleep(TYPING_DELAY);
        if (!isMountedRef.current) break;

        setIsTyping(false);
        const newMessage: ChatMessage = {
          id: uid(),
          content,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setConversationHistory((prev) => [...prev, { role: 'assistant', content }]);

        if (messageQueueRef.current.length > 0) {
          await sleep(MESSAGE_INTERVAL);
        }
      }
    } finally {
      processingQueueRef.current = false;
      if (isMountedRef.current) setIsTyping(false);
    }
  }, []);

  const addBotMessage = useCallback(
    (content: string) => {
      if (!content) return;
      messageQueueRef.current.push(content);
      void processMessageQueue();
    },
    [processMessageQueue]
  );

  // Wait until the queue is fully drained (used before AI responses)
  const waitForQueueIdle = useCallback(async () => {
    // Poll lightly — queue resolves on its own
    let safety = 0;
    while ((processingQueueRef.current || messageQueueRef.current.length > 0) && safety < 200) {
      await sleep(100);
      safety++;
    }
  }, []);

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: uid(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setConversationHistory((prev) => [...prev, { role: 'user', content }]);
  };

  // AI response — funneled through the same queue to keep order
  const getAIResponse = async (userMessage: string) => {
    if (isAiLoading) return;
    setIsAiLoading(true);

    try {
      await waitForQueueIdle();

      const { data, error } = await supabase.functions.invoke('ashley-chat', {
        body: {
          userMessage,
          userName,
          userGender,
          conversationHistory,
          step,
        },
      });

      if (error) throw error;

      const raw = data?.response || 'Me conta um pouco mais sobre o que você procura? 😊';
      const response = cleanAIResponse(raw) || 'Me conta um pouco mais sobre o que você procura? 😊';
      addBotMessage(response);
    } catch (err) {
      console.error('Ashley AI error:', err);
      addBotMessage('Tive um probleminha rapidinho aqui 😅. Pode repetir sua última mensagem?');
    } finally {
      if (isMountedRef.current) setIsAiLoading(false);
    }
  };

  // Initial greeting — protected against double-run
  useEffect(() => {
    if (!isOpen) {
      hasStartedRef.current = false;
      return;
    }
    if (hasStartedRef.current) {
      // Chat já iniciado — se um novo initialMessage veio, apenas injeta
      if (initialMessage) addBotMessage(initialMessage);
      return;
    }
    hasStartedRef.current = true;

    const startSequence = async () => {
      await sleep(300);
      if (initialMessage) {
        addBotMessage(initialMessage);
        addBotMessage('Sou Ashley da CineflixPayment! 👋 Me diz seu nome pra eu te ajudar melhor?');
      } else {
        addBotMessage('Olá! Sou Ashley da CineflixPayment! 👋 Qual é o seu nome?');
      }
      setStep('name');
    };
    void startSequence();
  }, [isOpen, initialMessage, addBotMessage]);

  const isValidName = (text: string): boolean => {
    const t = text.trim();
    if (t.length < 2 || t.length > 25) return false;
    if (/\d|[_@#$%^&*+=<>/\\|{}[\]~`]/.test(t)) return false;
    const bad = ['bot', 'robô', 'robo', 'teste', 'test', 'admin', 'null', 'undefined'];
    return !bad.includes(t.toLowerCase());
  };

  const extractName = (text: string): string | null => {
    const patterns = [
      /(?:me\s+chamo|meu\s+nome\s+[eé]|sou\s+[oa]?\s*|chamo\s*[-–]?\s*me)\s+([A-Za-zÀ-ÿ]+)/i,
      /(?:pode\s+me\s+chamar\s+de|meu\s+nome\s*[eé:]\s*)([A-Za-zÀ-ÿ]+)/i,
      /^([A-Za-zÀ-ÿ]{2,20})$/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const potentialName = match[1].trim();
        if (isValidName(potentialName)) {
          return potentialName.charAt(0).toUpperCase() + potentialName.slice(1).toLowerCase();
        }
      }
    }
    return null;
  };

  const handleSend = async () => {
    const raw = input.trim();
    if (!raw || isAiLoading) return;
    const text = raw.slice(0, MAX_INPUT_LEN);
    setInput('');
    addUserMessage(text);

    if (step === 'name') {
      let extractedName = extractName(text);
      if (!extractedName && isValidName(text)) {
        extractedName = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      }
      if (extractedName) {
        setUserName(extractedName);
        const guessed = guessGenderFromName(extractedName);
        addBotMessage(`Prazer em te conhecer, ${extractedName}! 😊`);
        if (guessed) {
          // Pula a pergunta de gênero — Ashley já deduziu pelo nome
          setUserGender(guessed);
          await showGenderRecommendations(guessed);
        } else {
          addBotMessage('Pra eu te recomendar os melhores conteúdos: você curte mais conteúdo masculino ou feminino? 🤔');
          setStep('gender');
        }
      } else {
        addBotMessage('Não peguei seu nome 😅. Pode me dizer só seu primeiro nome?');
      }
      return;
    }

    if (step === 'gender') {
      const lower = text.toLowerCase();
      const isMale = /\b(homem|masculino|ele|cara|boy|man|menino|garoto)\b/i.test(lower);
      const isFemale = /\b(mulher|feminino|ela|mina|girl|woman|menina|garota)\b/i.test(lower);
      if (isMale) {
        setUserGender('male');
        await showGenderRecommendations('male');
      } else if (isFemale) {
        setUserGender('female');
        await showGenderRecommendations('female');
      } else {
        addBotMessage('Me diz: você é homem ou mulher? 😊');
      }
      return;
    }

    // Free conversation (recommendations / plans / freeChat / recovery)
    await getAIResponse(text);
  };

  const presentPlanAt = async (index: number) => {
    const planId = PLAN_ORDER[index];
    if (!planId) return;
    setPlanPresentIndex(index);
    setPlanPitchDone(false);
    addBotMessage(PLAN_PITCHES[planId]);
    await waitForQueueIdle();
    if (isMountedRef.current) setPlanPitchDone(true);
  };

  const handleNextPlan = async () => {
    if (isTyping || isAiLoading || !planPitchDone) return;
    const next = planPresentIndex + 1;
    if (next >= PLAN_ORDER.length) {
      addBotMessage('Esses são todos os planos! Qual combina mais com você? 😊 É só tocar no card acima 👆');
      return;
    }
    addUserMessage('Quero ver o próximo plano');
    await presentPlanAt(next);
  };

  const showGenderRecommendations = async (gender: 'male' | 'female') => {
    setStep('recommendations');
    const intro =
      gender === 'male'
        ? `Show, ${userName}! Olha o catálogo que separei pra você 🔥`
        : `Perfeito, ${userName}! Preparei o conteúdo ideal pra você 💖`;
    addBotMessage(intro);

    const recs =
      gender === 'male'
        ? 'Temos filmes de ação, futebol ao vivo com Champions e Libertadores, super-heróis da Marvel e DC, e toda a saga Velozes e Furiosos em 4K! 🎬'
        : 'Temos os K-Dramas mais assistidos, séries românticas, reality shows como BBB, e as novelas turcas que todo mundo ama! 💕';
    addBotMessage(recs);
    addBotMessage('Agora deixa eu te apresentar nossos planos, um por um, pra você escolher o que mais combina 👇');
    setStep('plans');
    await presentPlanAt(0);
  };

  const handleSelectGender = (gender: 'male' | 'female') => {
    if (isAiLoading || isTyping) return;
    setUserGender(gender);
    addUserMessage(gender === 'male' ? 'Sou homem' : 'Sou mulher');
    void showGenderRecommendations(gender);
  };

  const handleSelectPlan = (plan: Plan) => {
    if (isAiLoading) return;
    setSelectedPlan(plan);
    addUserMessage(`Quero o ${plan.name}`);
    addBotMessage(`Excelente escolha, ${userName || 'amigo(a)'}! O ${plan.name} é perfeito! 🎉`);
    addBotMessage('Quer turbinar sua experiência com adicionais exclusivos? 🚀');
    setStep('upsell');
  };

  const toggleUpsell = (upsellId: string) => {
    setSelectedUpsells((prev) =>
      prev.includes(upsellId) ? prev.filter((id) => id !== upsellId) : [...prev, upsellId]
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
    if (!selectedPlan) return;
    setStep('checkout');

    const upsellParam = selectedUpsells.length > 0 ? `&upsells=${selectedUpsells.join(',')}` : '';
    const nomeParam = encodeURIComponent(userName || 'Cliente');
    const url = `/comprovante?plano=${selectedPlan.id}&nome=${nomeParam}${upsellParam}`;

    addBotMessage(`Perfeito, ${userName || 'amigo(a)'}! Gerando seu comprovante oficial... 🎟️`);
    setTimeout(() => {
      navigate(url);
      onClose();
    }, 1800);
  };

  const handleClose = () => {
    // Stops timers/animations; we keep history so user can resume
    onClose();
  };

  if (!isOpen) return null;

  const canType =
    step === 'name' ||
    step === 'gender' ||
    step === 'recovery' ||
    step === 'freeChat' ||
    step === 'plans' ||
    step === 'recommendations';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md h-[85vh] max-h-[700px] bg-gradient-to-b from-cinema-panel to-cinema-dark rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cinema-red to-cinema-glow p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-2 ring-white/40">
            <img src={ashleyAvatar.url} alt="Ashley — Suporte CineflixPayment" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">CineflixPayment</h3>
            <p className="text-white/80 text-sm flex items-center gap-2">
              Ashley — Assistente VIP
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fechar chat"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[85%] p-3 rounded-2xl animate-fade-in whitespace-pre-wrap break-words',
                msg.sender === 'bot'
                  ? 'bg-cinema-panel text-white rounded-bl-none'
                  : 'bg-cinema-red text-white ml-auto rounded-br-none'
              )}
            >
              {msg.content}
            </div>
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

          {/* Plan selection — um plano por vez, só depois da Ashley terminar de escrever */}
          {step === 'plans' && !selectedPlan && !isTyping && !isAiLoading && planPitchDone && (() => {
            const currentPlan = plans.find((p) => p.id === PLAN_ORDER[planPresentIndex]);
            if (!currentPlan) return null;
            const isLast = planPresentIndex >= PLAN_ORDER.length - 1;
            return (
              <div className="space-y-3 animate-slide-up">
                <div
                  className={cn('plan-card cursor-pointer relative', currentPlan.featured && 'featured')}
                  onClick={() => handleSelectPlan(currentPlan)}
                >
                  {currentPlan.discount && (
                    <span className="absolute top-2 right-2 text-xs font-bold text-cinema-red bg-cinema-red/20 px-2 py-1 rounded">
                      {currentPlan.discount}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{currentPlan.icon}</span>
                    <span className="font-bold">{currentPlan.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-cinema-glow mb-2">
                    R$ {currentPlan.price.toFixed(2)}
                    <span className="text-sm text-muted-foreground font-normal">{currentPlan.period}</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {currentPlan.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-cinema-red" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="cinema" size="sm" className="w-full mt-3">
                    ✅ Escolher este plano
                  </Button>
                </div>

                {!isLast && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-cinema-red/40 text-white hover:bg-cinema-red/10"
                    onClick={() => void handleNextPlan()}
                  >
                    Ver próximo plano →
                  </Button>
                )}
              </div>
            );
          })()}


          {/* Upsell selection */}
          {step === 'upsell' && !isTyping && (
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
          {(isTyping || isAiLoading) && (
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
        {canType && (
          <div className="p-4 border-t border-white/5 bg-black/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LEN))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={
                  step === 'name'
                    ? 'Ex: Me chamo Lucas...'
                    : step === 'gender'
                    ? 'Homem ou Mulher?'
                    : 'Digite sua mensagem...'
                }
                className="flex-1 bg-cinema-dark border-white/10 focus:border-cinema-red"
                maxLength={MAX_INPUT_LEN}
                disabled={isTyping || isAiLoading}
              />
              <Button
                variant="cinema"
                size="icon"
                onClick={() => void handleSend()}
                disabled={isTyping || isAiLoading || !input.trim()}
                aria-label="Enviar mensagem"
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
