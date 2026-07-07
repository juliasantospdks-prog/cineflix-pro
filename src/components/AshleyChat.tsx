import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Plan, Upsell } from '@/types';
import { plans, upsells } from '@/data/cineflix';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ashleyAvatar from '@/assets/ashley-avatar.png.asset.json';
import ashleyGreeting from '@/assets/ashley-greeting.mp3.asset.json';
import ashleyQuerido from '@/assets/ashley-querido.mp3.asset.json';
import ashleyQuerida from '@/assets/ashley-querida.mp3.asset.json';
import ashleyPitchMensal from '@/assets/ashley-pitch-mensal.mp3.asset.json';
import ashleyPitchTrimestral from '@/assets/ashley-pitch-trimestral.mp3.asset.json';
import ashleyPitchAnual from '@/assets/ashley-pitch-anual.mp3.asset.json';
import ashleyComparacao from '@/assets/ashley-comparacao.mp3.asset.json';
import ashleyUpsell from '@/assets/ashley-upsell.mp3.asset.json';
import ashleyComprovante from '@/assets/ashley-comprovante.mp3.asset.json';
import AshleyAudioBubble, { preloadAshleyAudioFiles, getPreloadedAudioDuration } from './AshleyAudioBubble';
import PlanComparisonCard from './PlanComparisonCard';
import ChatReceiptCard from './ChatReceiptCard';
import ChatMovieResults from './ChatMovieResults';
import { TMDBMovie, TMDBResponse } from '@/hooks/useTMDB';

interface AshleyChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

type ChatStep =
  | 'greeting'
  | 'name'
  | 'gender'
  | 'recommendations'
  | 'plans'
  | 'upsell'
  | 'receipt'
  | 'recovery'
  | 'freeChat';
type UserGender = 'male' | 'female' | null;

// Human-like pacing: give each message a real breathing pause,
// and stretch it after audio (so the user has time to listen).
const TYPING_DELAY_TEXT = 900;
const TYPING_DELAY_AUDIO = 700;
const TYPING_DELAY_CARD = 500;
const PAUSE_AFTER_TEXT = 1300;
const PAUSE_AFTER_AUDIO = 2600;
const PAUSE_AFTER_CARD = 1100;
const MAX_INPUT_LEN = 500;

const ASHLEY_AUDIO_URLS = [
  ashleyGreeting.url,
  ashleyQuerido.url,
  ashleyQuerida.url,
  ashleyPitchMensal.url,
  ashleyPitchTrimestral.url,
  ashleyPitchAnual.url,
  ashleyComparacao.url,
  ashleyUpsell.url,
  ashleyComprovante.url,
];

const PLAN_AUDIO: Record<string, string> = {
  mensal: ashleyPitchMensal.url,
  trimestral: ashleyPitchTrimestral.url,
  anual: ashleyPitchAnual.url,
};

const PLAN_ORDER = ['mensal', 'trimestral', 'anual'];

let __msgSeq = 0;
const uid = () => `m_${Date.now()}_${++__msgSeq}_${Math.random().toString(36).slice(2, 7)}`;

const cleanAIResponse = (text: string): string =>
  (text || '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^[-•●▪]\s*/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}/g, '')
    .trim();

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const MALE_NAMES = new Set([
  'lucas','joao','joão','pedro','miguel','gabriel','arthur','davi','david','bernardo','heitor','theo','enzo','lorenzo',
  'matheus','mateus','nicolas','samuel','rafael','vitor','victor','leonardo','leo','gustavo','henrique','felipe','filipe',
  'daniel','andre','andré','carlos','paulo','marcos','marcelo','rodrigo','ricardo','eduardo','fernando','bruno','thiago',
  'tiago','alexandre','antonio','antônio','jose','josé','luiz','luis','luís','sergio','sérgio','jorge','fabio','fábio',
  'diego','douglas','igor','isaac','joaquim','julio','mario','mário','otavio','otávio','pablo','renan','sandro',
  'vinicius','wesley','william','yuri','hugo','ian','juan','kauã','kauan','levi','murilo','noah','raul','vicente',
  'caio','breno','elias','edson','adriano','alan','alex','breno','cesar','cristiano','danilo','emerson','erick',
  'guilherme','italo','ivan','jefferson','jonas','joel','leandro','lincoln','lucca','luca','marcio','marlon','mateo',
  'natanael','nelson','oscar','patrick','renato','robson','sebastian','silas','tales','wagner','walter','washington',
  'wellington','yago','iago','dante','denis','flavio','flávio'
]);

const FEMALE_NAMES = new Set([
  'julia','juliana','maria','ana','sofia','sophia','alice','laura','isabella','isabela','manuela','helena','valentina',
  'lorena','livia','beatriz','bia','mariana','gabriela','rafaela','larissa','jessica','fernanda','camila','amanda',
  'leticia','vanessa','patricia','sandra','claudia','monica','carla','daniela','raquel','renata','debora','eduarda',
  'heloisa','joana','lara','lavinia','luiza','luísa','melissa','nicole','olivia','pietra','sarah','sara','tatiana',
  'yasmin','agatha','alicia','antonella','aurora','bianca','bruna','cecilia','clara','elisa','emily','esther','ester',
  'gabrielly','giovanna','isadora','lais','marcela','marina','milena','paula','priscila','rebeca','simone','stella',
  'vitoria','vivian','hannah','ingrid','iris','kelly','liz','marta','marcia','monique','natalia','nathalia','rita',
  'rosa','rose','sabrina','samira','sheila','silvia','soraia','suelen','suzana','talita','tatiane','teresa','vera',
  'viviane','elis','eloah','aline','andrea','angela','carolina','carol'
]);

const guessGenderFromName = (name: string): 'male' | 'female' | null => {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  if (MALE_NAMES.has(n)) return 'male';
  if (FEMALE_NAMES.has(n)) return 'female';
  const last = n.slice(-1);
  if (['a', 'á'].includes(last)) return 'female';
  if (['o', 'ó'].includes(last)) return 'male';
  return null;
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// ----- Message queue payload -----
type QueueItem =
  | { kind: 'text' | 'audio'; content: string; audioUrl?: string }
  | { kind: 'plan'; content: string; payload: Plan }
  | { kind: 'comparison'; content: string; payload: { cineflixPrice: number; planLabel: string } }
  | { kind: 'movies'; content: string; payload: { query: string; movies: TMDBMovie[] } }
  | { kind: 'receipt'; content: string; payload: { userName: string; plan: Plan; upsells: Upsell[] } };

const getMovieTitle = (movie: TMDBMovie) => movie.title || movie.name || 'esse título';

const stripCatalogQuery = (raw: string) => {
  const cleaned = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(voces|voce|vc|tem|têm|possui|possue|passa|assistir|assisti|ver|quero|queria|procura|procurar|buscar|busca|filme|serie|series|anime|desenho|catalogo|disponivel|na cineflix|no catalogo|ai|aí|por favor|pfv)\b/g, ' ')
    .replace(/[?!.,;:()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || raw.trim();
};

const isPlanIntent = (text: string) =>
  /\b(plano|planos|preço|preco|valor|assinar|assinatura|mensal|trimestral|anual|vip|comprar|pagar)\b/i.test(text);

const findRequestedPlan = (text: string) => {
  const lower = text.toLowerCase();
  if (/\bmensal\b/.test(lower)) return plans.find((p) => p.id === 'mensal') || null;
  if (/\btrimestral\b|\b3\s*meses\b/.test(lower)) return plans.find((p) => p.id === 'trimestral') || null;
  if (/\banual\b|\bvip\b|\bano\b/.test(lower)) return plans.find((p) => p.id === 'anual') || null;
  return null;
};

const looksLikeCatalogIntent = (text: string, currentStep: ChatStep) => {
  if (isPlanIntent(text)) return false;
  if (/\b(filme|série|serie|anime|doramas?|k-drama|catálogo|catalogo|assistir|tem|têm|disponível|disponivel|passa|procura|buscar|desenho)\b/i.test(text)) {
    return true;
  }
  const generic = /^(oi|olá|ola|bom dia|boa tarde|boa noite|sim|não|nao|ok|beleza|obrigado|obrigada|valeu)$/i;
  return (currentStep === 'recommendations' || currentStep === 'freeChat' || currentStep === 'plans') &&
    text.trim().length >= 3 &&
    text.trim().length <= 70 &&
    !generic.test(text.trim());
};

const AshleyChat = ({ isOpen, onClose, initialMessage }: AshleyChatProps) => {
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
  const messageQueueRef = useRef<QueueItem[]>([]);
  const processingQueueRef = useRef(false);
  const hasStartedRef = useRef(false);
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


  const processMessageQueue = useCallback(async () => {
    if (processingQueueRef.current) return;
    processingQueueRef.current = true;
    try {
      while (messageQueueRef.current.length > 0) {
        const item = messageQueueRef.current.shift()!;
        if (!isMountedRef.current) break;

        const typingDelay =
          item.kind === 'audio'
            ? TYPING_DELAY_AUDIO
            : item.kind === 'text'
            ? TYPING_DELAY_TEXT
            : TYPING_DELAY_CARD;

        setIsTyping(true);
        await sleep(typingDelay);
        if (!isMountedRef.current) break;
        setIsTyping(false);

        const msg: ChatMessage = {
          id: uid(),
          content: item.content,
          sender: 'bot',
          timestamp: new Date(),
          kind: item.kind,
          audioUrl: item.kind === 'audio' ? (item as { audioUrl?: string }).audioUrl : undefined,
          payload:
            item.kind === 'plan' || item.kind === 'comparison' || item.kind === 'movies' || item.kind === 'receipt'
              ? (item as { payload: unknown }).payload
              : undefined,
        };
        setMessages((prev) => [...prev, msg]);
        if (item.kind === 'text' || item.kind === 'audio') {
          setConversationHistory((prev) => [...prev, { role: 'assistant', content: item.content }]);
        }
        if (messageQueueRef.current.length > 0) {
          const pause =
            item.kind === 'audio'
              ? PAUSE_AFTER_AUDIO
              : item.kind === 'text'
              ? PAUSE_AFTER_TEXT
              : PAUSE_AFTER_CARD;
          // small human jitter (±180ms)
          const jitter = Math.floor(Math.random() * 360) - 180;
          await sleep(Math.max(400, pause + jitter));
        }
      }
    } finally {
      processingQueueRef.current = false;
      if (isMountedRef.current) setIsTyping(false);
    }
  }, []);

  const enqueue = useCallback(
    (item: QueueItem) => {
      messageQueueRef.current.push(item);
      void processMessageQueue();
    },
    [processMessageQueue]
  );

  const addBotText = useCallback(
    (content: string) => {
      if (!content) return;
      enqueue({ kind: 'text', content });
    },
    [enqueue]
  );

  const addBotAudio = useCallback(
    (content: string, audioUrl: string) => {
      enqueue({ kind: 'audio', content, audioUrl });
    },
    [enqueue]
  );

  const addPlanCard = useCallback((plan: Plan) => enqueue({ kind: 'plan', content: plan.name, payload: plan }), [enqueue]);
  const addComparisonCard = useCallback(
    (cineflixPrice: number, planLabel: string) =>
      enqueue({ kind: 'comparison', content: 'Comparativo', payload: { cineflixPrice, planLabel } }),
    [enqueue]
  );
  const addMovieResults = useCallback(
    (query: string, movies: TMDBMovie[]) =>
      enqueue({ kind: 'movies', content: `Resultados para ${query}`, payload: { query, movies } }),
    [enqueue]
  );
  const addReceiptCard = useCallback(
    (data: { userName: string; plan: Plan; upsells: Upsell[] }) =>
      enqueue({ kind: 'receipt', content: 'Comprovante', payload: data }),
    [enqueue]
  );

  const waitForQueueIdle = useCallback(async () => {
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
      kind: 'text',
    };
    setMessages((prev) => [...prev, newMessage]);
    setConversationHistory((prev) => [...prev, { role: 'user', content }]);
  };

  const getAIResponse = async (userMessage: string) => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      await waitForQueueIdle();
      const { data, error } = await supabase.functions.invoke('ashley-chat', {
        body: { userMessage, userName, userGender, conversationHistory, step },
      });
      if (error) throw error;
      const raw = data?.response || 'Me conta um pouco mais sobre o que você procura? 😊';
      const response = cleanAIResponse(raw) || 'Me conta um pouco mais sobre o que você procura? 😊';
      addBotText(response);
    } catch (err) {
      console.error('Ashley AI error:', err);
      addBotText('Tive um probleminha rapidinho aqui 😅. Pode repetir sua última mensagem?');
    } finally {
      if (isMountedRef.current) setIsAiLoading(false);
    }
  };

  const searchCatalog = useCallback(
    async (rawQuery: string) => {
      if (isAiLoading) return;
      const query = stripCatalogQuery(rawQuery);
      setIsAiLoading(true);
      try {
        await waitForQueueIdle();
        const { data, error } = await supabase.functions.invoke('tmdb', {
          body: {
            endpoint: '/search/multi',
            params: {
              query,
              include_adult: 'false',
              page: '1',
            },
          },
        });
        if (error) throw error;
        const results = ((data as TMDBResponse)?.results || [])
          .filter((item) =>
            (item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type) &&
            (item.poster_path || item.backdrop_path)
          )
          .slice(0, 3);

        if (results.length) {
          addBotText(`Achei sim, ${userName || 'meu bem'} 🔥 Confere aqui dentro do chat e toca em confirmar no título que você quer.`);
          addMovieResults(query, results);
          addBotText('Se for esse mesmo, eu já te mostro o plano mais indicado pra liberar o acesso agora.');
          setStep('freeChat');
        } else {
          addBotText('Não achei esse título certinho no catálogo agora 😅. Me manda só o nome do filme ou série, sem frase, que eu busco de novo.');
          setStep('freeChat');
        }
      } catch (err) {
        console.error('TMDB chat search error:', err);
        addBotText('Minha busca no catálogo oscilou rapidinho 😅. Me manda o nome exato do filme ou série que eu tento novamente.');
      } finally {
        if (isMountedRef.current) setIsAiLoading(false);
      }
    },
    [addBotText, addMovieResults, isAiLoading, userName, waitForQueueIdle]
  );

  const handleConfirmMovie = useCallback(
    (movie: TMDBMovie) => {
      const title = getMovieTitle(movie);
      addUserMessage(`Confirmo: ${title}`);
      addBotText(`${title} tá disponível sim, ${userName || 'meu bem'} ✅`);
      addBotText('Pra assistir sem trava, minha indicação é o Anual VIP: 4 telas, 4K e acesso antecipado. Mas se quiser começar menor, o mensal também libera o catálogo.');
      const anual = plans.find((p) => p.id === 'anual');
      if (anual) {
        addBotAudio(`${anual.icon} ${anual.name}`, PLAN_AUDIO.anual);
        addPlanCard(anual);
        addComparisonCard(anual.price, anual.name);
      }
      setStep('plans');
    },
    [addBotText, addBotAudio, addPlanCard, addComparisonCard, userName]
  );

  useEffect(() => {
    if (!isOpen) {
      hasStartedRef.current = false;
      return;
    }
    preloadAshleyAudioFiles(ASHLEY_AUDIO_URLS);
    if (hasStartedRef.current) {
      if (initialMessage) addBotText(initialMessage);
      return;
    }
    hasStartedRef.current = true;

    const startSequence = async () => {
      await sleep(300);
      if (initialMessage) addBotText(initialMessage);
      addBotAudio(
        'Oi, meu bem! 🎬 Eu sou a Ashley aqui da CineflixPayment. Toca no ▶️ pra me ouvir. Me diz seu nome, vai?',
        ashleyGreeting.url
      );
      setStep('name');
    };
    void startSequence();
  }, [isOpen, initialMessage, addBotText, addBotAudio]);

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
    for (const p of patterns) {
      const m = text.match(p);
      if (m && m[1]) {
        const c = m[1].trim();
        if (isValidName(c)) return c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
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
      let extracted = extractName(text);
      if (!extracted && isValidName(text)) {
        extracted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      }
      if (extracted) {
        setUserName(extracted);
        const guessed = guessGenderFromName(extracted);
        if (guessed === 'male') {
          addBotAudio(`Aaah, ${extracted}, que nome lindo, querido! 😊`, ashleyQuerido.url);
          setUserGender('male');
          await showGenderRecommendations('male');
        } else if (guessed === 'female') {
          addBotAudio(`Aaah, ${extracted}, que nome lindo, querida! 💖`, ashleyQuerida.url);
          setUserGender('female');
          await showGenderRecommendations('female');
        } else {
          addBotText(`Prazer em te conhecer, ${extracted}! 😊 Me diz: você é homem ou mulher? Pra eu recomendar melhor.`);
          setStep('gender');
        }
      } else {
        addBotText('Não peguei seu nome 😅. Pode me dizer só seu primeiro nome?');
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
        addBotText('Me diz: você é homem ou mulher? 😊');
      }
      return;
    }

    const requestedPlan = findRequestedPlan(text);
    if (requestedPlan) {
      await waitForQueueIdle();
      addBotText(`Claro, ${userName || 'meu bem'}! Vou te mostrar o ${requestedPlan.name} do jeito certo 👇`);
      addBotAudio(`${requestedPlan.icon} ${requestedPlan.name}`, PLAN_AUDIO[requestedPlan.id] || ashleyPitchMensal.url);
      addPlanCard(requestedPlan);
      addComparisonCard(requestedPlan.price, requestedPlan.name);
      setStep('plans');
      return;
    }

    if (looksLikeCatalogIntent(text, step)) {
      await searchCatalog(text);
      return;
    }

    await getAIResponse(text);
  };

  const presentPlanAt = async (index: number) => {
    const planId = PLAN_ORDER[index];
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setPlanPresentIndex(index);
    setPlanPitchDone(false);

    // 1) audio pitch
    addBotAudio(`${plan.icon} ${plan.name}`, PLAN_AUDIO[planId]);
    // 2) plan card
    addPlanCard(plan);
    // 3) comparison card + audio only for first (mensal)
    if (planId === 'mensal') {
      addBotAudio('Olha essa comparação, vai te chocar 👀', ashleyComparacao.url);
      addComparisonCard(plan.price, plan.name);
    }
    await waitForQueueIdle();
    if (isMountedRef.current) setPlanPitchDone(true);
  };

  const handleNextPlan = async () => {
    if (isTyping || isAiLoading || !planPitchDone) return;
    const next = planPresentIndex + 1;
    if (next >= PLAN_ORDER.length) {
      addBotText('Esses são todos os planos, meu bem! 😊 É só tocar no card acima 👆');
      return;
    }
    addUserMessage('Ver próximo plano');
    await presentPlanAt(next);
  };

  const showGenderRecommendations = async (gender: 'male' | 'female') => {
    setStep('recommendations');
    const carinho = gender === 'male' ? 'querido' : 'querida';
    const intro =
      gender === 'male'
        ? `Show, ${carinho}! Olha o catálogo que separei pra você 🔥`
        : `Perfeito, ${carinho}! Preparei o conteúdo ideal pra você 💖`;
    addBotText(intro);
    const recs =
      gender === 'male'
        ? 'Filmes de ação, futebol ao vivo com Champions e Libertadores, Marvel, DC, e toda a saga Velozes e Furiosos em 4K! 🎬'
        : 'Os K-Dramas mais assistidos, séries românticas, reality shows, e as novelas turcas que todo mundo ama! 💕';
    addBotText(recs);
    addBotText('Agora deixa eu te apresentar nossos planos, um por um 👇');
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
    addBotText(`Excelente escolha, ${userName || 'meu bem'}! O ${plan.name} é perfeito pra você 🎉`);
    addBotAudio('Antes de finalizar, dá uma olhadinha nos adicionais 👇', ashleyUpsell.url);
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
      const u = upsells.find((x) => x.id === id);
      if (u) total += u.price;
    });
    return total;
  };

  const handleConfirmUpsells = async () => {
    if (!selectedPlan) return;
    setStep('receipt');
    const chosenUpsells = selectedUpsells
      .map((id) => upsells.find((u) => u.id === id))
      .filter((u): u is Upsell => !!u);

    addBotText(`Perfeito, ${userName || 'meu bem'}! Já tô gerando seu comprovante... ✨`);
    addBotAudio('Prontinho! Seu comprovante tá aí 👇', ashleyComprovante.url);
    addReceiptCard({
      userName: userName || 'Cliente',
      plan: selectedPlan,
      upsells: chosenUpsells,
    });
    addBotText('Baixa o PDF ou envia direto no WhatsApp — o que ficar melhor pra você 💖');
  };

  const handleClose = () => onClose();

  if (!isOpen) return null;

  const canType =
    step === 'name' ||
    step === 'gender' ||
    step === 'recovery' ||
    step === 'freeChat' ||
    step === 'plans' ||
    step === 'recommendations';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md h-[90vh] sm:h-[85vh] max-h-[720px] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/5 animate-scale-in bg-cinema-dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — CineflixPayment brand */}
        <div className="bg-gradient-to-r from-cinema-red to-red-800 p-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-2 ring-white/40 flex-shrink-0">
            <img src={ashleyAvatar.url} alt="Ashley" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white leading-tight">Ashley</h3>
            <p className="text-white/85 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              online — CineflixPayment
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

        {/* Messages surface — WhatsApp look */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 wa-chat-surface">
          {/* Date chip */}
          <div className="flex justify-center py-1">
            <span className="wa-date-chip">HOJE</span>
          </div>

          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            const time = formatTime(msg.timestamp);

            // Full-width widget bubbles (plan card, comparison, receipt)
            if (msg.kind === 'plan' && msg.payload) {
              const plan = msg.payload as Plan;
              return (
                <div key={msg.id} className="flex justify-start animate-fade-in">
                  <div className="relative max-w-[92%] w-full bg-[#202c33] rounded-lg overflow-hidden shadow-md">
                    <div className={cn('p-3', plan.featured && 'ring-1 ring-cinema-glow')}>
                      {plan.discount && (
                        <span className="inline-block text-[10px] font-bold text-cinema-red bg-cinema-red/20 px-2 py-0.5 rounded mb-1.5">
                          {plan.discount}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-2xl">{plan.icon}</span>
                        <span className="font-bold text-white text-sm">{plan.name}</span>
                      </div>
                      <div className="text-2xl font-black text-cinema-glow mb-2">
                        R$ {plan.price.toFixed(2)}
                        <span className="text-xs text-white/50 font-normal">{plan.period}</span>
                      </div>
                      <ul className="text-xs text-white/80 space-y-1 mb-3">
                        {plan.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-cinema-red flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant="cinema"
                        size="sm"
                        className="w-full"
                        onClick={() => handleSelectPlan(plan)}
                      >
                        ✅ Escolher este plano
                      </Button>
                    </div>
                    <div className="wa-time text-right px-3 pb-1.5">{time}</div>
                  </div>
                </div>
              );
            }

            if (msg.kind === 'comparison' && msg.payload) {
              const p = msg.payload as { cineflixPrice: number; planLabel: string };
              return (
                <div key={msg.id} className="flex justify-start animate-fade-in">
                  <div className="max-w-[92%] w-full">
                    <PlanComparisonCard cineflixPrice={p.cineflixPrice} planLabel={p.planLabel} />
                    <div className="wa-time text-right pr-1 pt-1">{time}</div>
                  </div>
                </div>
              );
            }

            if (msg.kind === 'movies' && msg.payload) {
              const p = msg.payload as { query: string; movies: TMDBMovie[] };
              return (
                <div key={msg.id} className="flex justify-start animate-fade-in">
                  <div className="max-w-[94%] w-full">
                    <ChatMovieResults query={p.query} movies={p.movies} onConfirm={handleConfirmMovie} />
                    <div className="wa-time text-right pr-1 pt-1">{time}</div>
                  </div>
                </div>
              );
            }

            if (msg.kind === 'receipt' && msg.payload) {
              const p = msg.payload as { userName: string; plan: Plan; upsells: Upsell[] };
              return (
                <div key={msg.id} className="flex justify-start animate-fade-in">
                  <div>
                    <ChatReceiptCard userName={p.userName} plan={p.plan} selectedUpsells={p.upsells} />
                    <div className="wa-time text-right pr-1 pt-1">{time}</div>
                  </div>
                </div>
              );
            }

            // Text / audio bubbles
            return (
              <div
                key={msg.id}
                className={cn('flex animate-fade-in', isBot ? 'justify-start' : 'justify-end')}
              >
                <div
                  className={cn(
                    'relative max-w-[85%] px-2.5 pt-1.5 pb-1 rounded-lg shadow-md break-words',
                    isBot ? 'wa-bubble-bot wa-bubble-tail-left ml-2' : 'wa-bubble-user wa-bubble-tail-right mr-2'
                  )}
                  style={{ minWidth: msg.kind === 'audio' ? 260 : undefined }}
                >
                  {msg.kind === 'audio' && msg.audioUrl ? (
                    <div className="py-1.5">
                      <AshleyAudioBubble url={msg.audioUrl} />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap pr-12">{msg.content}</p>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="wa-time">{time}</span>
                    {!isBot && <CheckCheck className="w-3.5 h-3.5 wa-check" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Gender selection */}
          {step === 'gender' && !isTyping && (
            <div className="flex gap-2 pt-1 animate-slide-up">
              <button
                onClick={() => handleSelectGender('male')}
                className="flex-1 p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 transition-all"
              >
                <span className="text-2xl block mb-1">👨</span>
                <span className="font-semibold text-white text-sm">Sou Homem</span>
              </button>
              <button
                onClick={() => handleSelectGender('female')}
                className="flex-1 p-3 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 transition-all"
              >
                <span className="text-2xl block mb-1">👩</span>
                <span className="font-semibold text-white text-sm">Sou Mulher</span>
              </button>
            </div>
          )}

          {/* "Next plan" button after each pitch */}
          {step === 'plans' && !selectedPlan && !isTyping && !isAiLoading && planPitchDone &&
            planPresentIndex < PLAN_ORDER.length - 1 && (
              <div className="flex justify-center pt-1 animate-fade-in">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cinema-red/40 text-white hover:bg-cinema-red/10 rounded-full"
                  onClick={() => void handleNextPlan()}
                >
                  Ver próximo plano →
                </Button>
              </div>
            )}

          {/* Upsells */}
          {step === 'upsell' && !isTyping && (
            <div className="space-y-2 pt-1 animate-slide-up">
              {upsells.map((u) => {
                const active = selectedUpsells.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUpsell(u.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                      active
                        ? 'bg-cinema-red/15 border-cinema-red/60'
                        : 'bg-[#202c33] border-white/10 hover:bg-[#2a3942]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border',
                        active ? 'bg-cinema-red border-cinema-red' : 'border-white/30'
                      )}
                    >
                      {active && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{u.name}</div>
                      <div className="text-xs text-white/60 truncate">{u.description}</div>
                    </div>
                    <span className="text-cinema-glow font-bold text-sm whitespace-nowrap">
                      R$ {u.price.toFixed(2)}
                    </span>
                  </div>
                );
              })}

              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/60 text-sm">Total:</span>
                  <span className="text-2xl font-black text-white">R$ {calculateTotal().toFixed(2)}</span>
                </div>
                <Button variant="cinema" size="lg" className="w-full" onClick={() => void handleConfirmUpsells()}>
                  ✅ CONFIRMAR E GERAR COMPROVANTE
                </Button>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {(isTyping || isAiLoading) && (
            <div className="flex justify-start">
              <div className="wa-bubble-bot wa-bubble-tail-left ml-2 relative px-3 py-2.5 rounded-lg shadow-md">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {canType && (
          <div className="p-2.5 bg-[#1f2c34] flex-shrink-0">
            <div className="flex gap-2 items-center">
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
                    ? 'Digite seu nome...'
                    : step === 'gender'
                    ? 'Homem ou Mulher?'
                    : 'Mensagem'
                }
                className="flex-1 bg-[#2a3942] border-transparent focus:border-cinema-red rounded-full text-white placeholder:text-white/40 h-10"
                maxLength={MAX_INPUT_LEN}
                disabled={isTyping || isAiLoading}
              />
              <button
                onClick={() => void handleSend()}
                disabled={isTyping || isAiLoading || !input.trim()}
                aria-label="Enviar mensagem"
                className="w-10 h-10 rounded-full bg-cinema-red hover:bg-red-700 disabled:bg-white/10 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AshleyChat;
