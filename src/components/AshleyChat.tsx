import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Plan, Upsell } from '@/types';
import { plans, upsells } from '@/data/cineflix';
import { cn } from '@/lib/utils';
import { sanitizeAshleyText } from '@/lib/sanitizeText';
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

// ---- Device identity + session persistence ----
const DEVICE_KEY = 'cineflix.ashley.deviceId';
const SESSION_KEY = 'cineflix.ashley.session.v1';

const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'nostorage';
  }
};

interface AshleySession {
  greeted?: boolean;
  userName?: string;
  userGender?: UserGender;
  lastSeen?: number;
}

const loadSession = (): AshleySession => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AshleySession) : {};
  } catch {
    return {};
  }
};

const saveSession = (patch: AshleySession) => {
  if (typeof window === 'undefined') return;
  try {
    const cur = loadSession();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...cur, ...patch, lastSeen: Date.now() }));
  } catch {
    /* ignore */
  }
};

// ---- Structured console logger for the chat state machine ----
const LOG = (event: string, data?: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.log(`[AshleyChat] ${event}`, data ?? '');
};

const cleanAIResponse = (text: string): string => sanitizeAshleyText(text, 1);

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

// Intent detection, title resolution and next step are decided by the AI
// in the ashley-chat edge function — no keyword guessing on the client.



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
  const presentPlanAtRef = useRef<((index: number) => Promise<void>) | null>(null);

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
    if (processingQueueRef.current) {
      LOG('queue.busy — process call skipped', { pending: messageQueueRef.current.length });
      return;
    }
    processingQueueRef.current = true;
    LOG('queue.start', { pending: messageQueueRef.current.length });
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

        LOG('queue.next', {
          kind: item.kind,
          preview: item.content?.slice(0, 60),
          typingDelayMs: typingDelay,
          remaining: messageQueueRef.current.length,
        });

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
        LOG('queue.sent', { id: msg.id, kind: item.kind });
        if (item.kind === 'text' || item.kind === 'audio') {
          setConversationHistory((prev) => [...prev, { role: 'assistant', content: item.content }]);
        }
        if (messageQueueRef.current.length > 0) {
          let pause: number;
          if (item.kind === 'audio') {
            const audioUrl = (item as { audioUrl?: string }).audioUrl;
            const dur = audioUrl ? getPreloadedAudioDuration(audioUrl) : 0;
            pause = dur > 0 ? Math.round(dur * 1000) + 900 : PAUSE_AFTER_AUDIO;
          } else if (item.kind === 'text') {
            pause = PAUSE_AFTER_TEXT;
          } else {
            pause = PAUSE_AFTER_CARD;
          }
          const jitter = Math.floor(Math.random() * 360) - 180;
          const wait = Math.max(500, pause + jitter);
          const upcoming = messageQueueRef.current[0];
          LOG('queue.pause', {
            afterKind: item.kind,
            waitMs: wait,
            nextKind: upcoming?.kind,
            nextPreview: upcoming?.content?.slice(0, 60),
          });
          await sleep(wait);
        }
      }
    } finally {
      processingQueueRef.current = false;
      if (isMountedRef.current) setIsTyping(false);
      LOG('queue.idle');
    }
  }, []);

  const enqueue = useCallback(
    (item: QueueItem) => {
      messageQueueRef.current.push(item);
      LOG('queue.enqueue', {
        kind: item.kind,
        preview: item.content?.slice(0, 60),
        depth: messageQueueRef.current.length,
        processing: processingQueueRef.current,
      });
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


  // Search the catalog with the title already resolved by the AI.
  const searchCatalog = useCallback(
    async (title: string, replyBefore?: string) => {
      const query = (title || '').trim();
      if (!query) return;
      try {
        await waitForQueueIdle();
        LOG('catalog.search', { query });
        const { data, error } = await supabase.functions.invoke('tmdb', {
          body: { mode: 'smart_search', query },
        });
        if (error) throw error;

        const payload = data as { results?: TMDBMovie[]; suggestions?: TMDBMovie[]; strategy?: string };
        const results = (payload?.results || []).slice(0, 3);
        const suggestions = (payload?.suggestions || []).slice(0, 3);
        LOG('catalog.result', { strategy: payload?.strategy, found: results.length });

        if (results.length) {
          addBotText(cleanAIResponse(replyBefore || `Tem sim, ${userName || 'meu bem'} — já achei no catálogo.`));
          addMovieResults(query, results);
          addBotText('Toca em confirmar no título certo que eu libero seu acesso agora.');
        } else if (suggestions.length) {
          addBotText(`Esse título específico eu não localizei agora, ${userName || 'meu bem'}, mas olha o que está em alta aqui.`);
          addMovieResults(query, suggestions);
          addBotText('Me diz o nome exato que eu procuro de novo, ou escolhe um desses e eu libero na hora.');
        } else {
          addBotText('Me manda só o nome do filme ou da série, sem frase, que eu busco de novo pra você.');
        }
        setStep('freeChat');
      } catch (err) {
        console.error('TMDB chat search error:', err);
        addBotText('Minha busca oscilou rapidinho. Me manda o nome do título que eu tento novamente.');
      }
    },
    [addBotText, addMovieResults, userName, waitForQueueIdle]
  );

  // The AI decides the intent, the resolved title and the next step.
  const routeWithAI = useCallback(
    async (text: string) => {
      if (isAiLoading) return;
      setIsAiLoading(true);
      try {
        await waitForQueueIdle();
        const { data, error } = await supabase.functions.invoke('ashley-chat', {
          body: { userMessage: text, userName, userGender, conversationHistory, step },
        });
        if (error) throw error;

        const decision = (data || {}) as {
          intent?: string;
          title_query?: string;
          plan_id?: string;
          reply?: string;
          response?: string;
          next_step?: string;
        };
        const reply = cleanAIResponse(decision.reply || decision.response || '');
        LOG('ai.decision', {
          intent: decision.intent,
          title: decision.title_query,
          plan: decision.plan_id,
          nextStep: decision.next_step,
        });

        if (decision.intent === 'catalog' && decision.title_query) {
          await searchCatalog(decision.title_query, reply);
          return;
        }

        const planId = decision.plan_id && decision.plan_id !== 'none' ? decision.plan_id : null;
        if (decision.intent === 'plans' || planId) {
          if (reply) addBotText(reply);
          const plan = planId ? plans.find((p) => p.id === planId) : null;
          if (plan) {
            addBotAudio(plan.name, PLAN_AUDIO[plan.id] || ashleyPitchMensal.url);
            addPlanCard(plan);
            addComparisonCard(plan.price, plan.name);
            setStep('plans');
          } else {
            await presentPlanAtRef.current?.(0);
          }
          return;
        }

        if (reply) addBotText(reply);
        const next = decision.next_step;
        if (next === 'plans' || next === 'recommendations' || next === 'freeChat') {
          setStep(next as ChatStep);
        } else {
          setStep('freeChat');
        }
      } catch (err) {
        console.error('Ashley routing error:', err);
        addBotText('Deu uma instabilidade aqui do meu lado. Pode repetir sua última mensagem?');
      } finally {
        if (isMountedRef.current) setIsAiLoading(false);
      }
    },
    [
      addBotAudio,
      addBotText,
      addComparisonCard,
      addPlanCard,
      conversationHistory,
      isAiLoading,
      searchCatalog,
      step,
      userGender,
      userName,
      waitForQueueIdle,
    ]
  );

  const handleConfirmMovie = useCallback(
    (movie: TMDBMovie) => {
      const title = getMovieTitle(movie);
      addUserMessage(`Confirmo: ${title}`);
      addBotText(`${title} está liberado no catálogo, ${userName || 'meu bem'}.`);
      addBotText('Pra assistir sem travar em nenhum dispositivo, o Anual VIP é o que mais vale: 4 telas, 4K e acesso antecipado. Se quiser começar pequeno, o mensal já libera tudo hoje.');
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

    const deviceId = getDeviceId();
    const session = loadSession();
    LOG('session.load', { deviceId, session });

    const startSequence = async () => {
      await sleep(300);
      if (initialMessage) addBotText(initialMessage);

      if (session.greeted) {
        // Returning device: skip the audio greeting so Ashley doesn't repeat herself.
        const name = session.userName || '';
        if (session.userGender) setUserGender(session.userGender);
        if (name) setUserName(name);
        LOG('session.returning — skipping greeting', { name, gender: session.userGender });
        addBotText(
          name
            ? `Oi de novo, ${name}. Me diz o título que você quer assistir hoje que eu libero na hora.`
            : 'Oi de novo. Me diz o título que você quer assistir hoje que eu libero na hora.'
        );
        setStep(name ? 'freeChat' : 'name');
        return;
      }

      addBotAudio(
        'Oi, eu sou a Ashley da CineflixPayment. Toca no play pra me ouvir e me diz seu nome, vai? 🎬',
        ashleyGreeting.url
      );
      setStep('name');
      saveSession({ greeted: true });
      LOG('session.greeted — flag saved');
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
        saveSession({ userName: extracted });
        const guessed = guessGenderFromName(extracted);
        if (guessed === 'male') {
          addBotAudio(`Aaah, ${extracted}, que nome bom, querido.`, ashleyQuerido.url);
          setUserGender('male');
          saveSession({ userGender: 'male' });
          await showGenderRecommendations('male');
        } else if (guessed === 'female') {
          addBotAudio(`Aaah, ${extracted}, que nome lindo, querida.`, ashleyQuerida.url);
          setUserGender('female');
          saveSession({ userGender: 'female' });
          await showGenderRecommendations('female');
        } else {
          addBotText(`Prazer, ${extracted}. Me diz rapidinho: você é homem ou mulher? É só pra eu acertar na indicação.`);
          setStep('gender');
        }
      } else {
        addBotText('Não peguei seu nome. Pode me dizer só o primeiro?');
      }
      return;
    }

    if (step === 'gender') {
      const lower = text.toLowerCase();
      const isMale = /\b(homem|masculino|ele|cara|boy|man|menino|garoto)\b/i.test(lower);
      const isFemale = /\b(mulher|feminino|ela|mina|girl|woman|menina|garota)\b/i.test(lower);
      if (isMale) {
        setUserGender('male');
        saveSession({ userGender: 'male' });
        await showGenderRecommendations('male');
      } else if (isFemale) {
        setUserGender('female');
        saveSession({ userGender: 'female' });
        await showGenderRecommendations('female');
      } else {
        addBotText('Me diz rapidinho: você é homem ou mulher? Aí eu acerto na recomendação.');
      }
      return;
    }

    // From here on the AI does the reasoning and decides what happens next.
    await routeWithAI(text);
  };

  const presentPlanAt = async (index: number) => {
    const planId = PLAN_ORDER[index];
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setPlanPresentIndex(index);
    setPlanPitchDone(false);

    // 1) audio pitch
    addBotAudio(plan.name, PLAN_AUDIO[planId]);
    // 2) plan card
    addPlanCard(plan);
    // 3) comparison card + audio only for first (mensal)
    if (planId === 'mensal') {
      addBotAudio('Olha essa comparação de preço com os outros streamings.', ashleyComparacao.url);
      addComparisonCard(plan.price, plan.name);
    }
    await waitForQueueIdle();
    if (isMountedRef.current) setPlanPitchDone(true);
  };

  presentPlanAtRef.current = presentPlanAt;



  const handleNextPlan = async () => {
    if (isTyping || isAiLoading || !planPitchDone) return;
    const next = planPresentIndex + 1;
    if (next >= PLAN_ORDER.length) {
      addBotText('Esses são os três planos. Escolhe no card aqui em cima que eu já gero seu acesso.');
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
        ? `Fechado, ${carinho}. Separei o que mais roda aqui pro seu perfil.`
        : `Perfeito, ${carinho}. Separei o que mais roda aqui pro seu perfil.`;
    addBotText(intro);
    const recs =
      gender === 'male'
        ? 'Ação, futebol ao vivo com Champions e Libertadores, Marvel, DC e as sagas completas em 4K, tudo sem anúncio.'
        : 'K-dramas do momento, séries de romance, reality shows e as novelas turcas completas, tudo dublado e legendado.';
    addBotText(recs);
    addBotText('Agora te mostro o plano que mais faz sentido, começando pelo mais barato.');
    setStep('plans');
    await presentPlanAt(0);
  };

  const handleSelectGender = (gender: 'male' | 'female') => {
    if (isAiLoading || isTyping) return;
    setUserGender(gender);
    saveSession({ userGender: gender });
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
