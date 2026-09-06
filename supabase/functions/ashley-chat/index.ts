import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DECISION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    intent: {
      type: 'string',
      enum: ['catalog', 'plans', 'question', 'objection', 'smalltalk', 'checkout'],
      description: 'What the user actually wants right now.',
    },
    title_query: {
      type: 'string',
      description:
        'When intent is catalog, the clean canonical title of the movie/series/anime the user means (resolve nicknames, actors, typos, English/Portuguese). Empty string otherwise.',
    },
    plan_id: {
      type: 'string',
      enum: ['mensal', 'trimestral', 'anual', 'none'],
      description: 'Plan explicitly asked for, or "none".',
    },
    reply: {
      type: 'string',
      description: 'Ashley reply in plain conversational pt-BR. One short paragraph, max 2 sentences.',
    },
    next_step: {
      type: 'string',
      enum: ['freeChat', 'plans', 'recommendations', 'upsell', 'checkout'],
      description: 'Conversation step the front-end should move to.',
    },
  },
  required: ['intent', 'title_query', 'plan_id', 'reply', 'next_step'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { userMessage, userName, userGender, conversationHistory, step } = await req.json();

    if (typeof userMessage !== 'string' || !userMessage.trim()) {
      return new Response(JSON.stringify({ error: 'userMessage is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const genderContext =
      userGender === 'male'
        ? 'O usuário é homem: priorize ação, futebol ao vivo, super-heróis, ficção e aventura.'
        : userGender === 'female'
        ? 'A usuária é mulher: priorize K-dramas, romance, séries de drama, reality e novelas.'
        : '';

    const systemPrompt = `Você é Ashley, vendedora humana da CineflixPayment (streaming com filmes, séries, animes, futebol ao vivo).

COMO PENSAR (raciocínio obrigatório antes de responder):
1. Leia a última mensagem junto com o histórico e descubra a real intenção.
2. Se o usuário citar QUALQUER obra — mesmo com erro de digitação, apelido, nome em inglês, "aquele filme do Vin Diesel", "a série do jogo do dinheiro" — a intenção é "catalog" e você DEVE preencher title_query com o título canônico correto (ex.: "Round 6", "Velozes e Furiosos", "Duna: Parte 2").
3. Mensagem curta (1 a 6 palavras) que não seja saudação, preço ou dúvida é SEMPRE nome de obra: "Impuros" é série brasileira, "Terra e Paixão" é novela, "Solo Leveling" é anime. Classifique como catalog e preencha title_query.
4. Nunca diga que não temos um título. O catálogo é gigante; a busca real acontece depois. Trate como disponível.
5. Se ele falar de preço, plano, assinar, pagar: intenção "plans".
6. Ao apresentar planos, comece SEMPRE pelo MENSAL. Só escolha trimestral ou anual quando o usuário pedir esse período claramente.
7. Dúvida sobre funcionamento: "question". Reclamação/resistência de preço: "objection". Conversa solta: "smalltalk".

PLANOS:
MENSAL R$ 29,90 (30 dias, 1 tela, Full HD)
TRIMESTRAL R$ 75,90 (90 dias, 2 telas, 4K, download offline, economiza 20%)
ANUAL VIP R$ 300,00 (365 dias, 4 telas, 4K, downloads ilimitados, acesso antecipado)

O pagamento é finalizado no checkout seguro da Cakto. O comprovante só aparece como aprovado DEPOIS que o pagamento é confirmado — nunca prometa aprovação antes disso.
Não vendemos APK vitalício. Se perguntarem, diga que foi descontinuado e ofereça o Anual VIP.
Se houver resistência de preço, ofereça o cupom VOLTA10 (10% off).

${genderContext}

FORMATO DO CAMPO reply (obrigatório):
- Português brasileiro informal, tom de vendedora de verdade.
- No máximo 2 frases curtas.
- No máximo 1 emoji, e só quando somar de verdade.
- Proibido: asteriscos, listas, numeração, hashtags, crases, markdown.
- Nunca invente preço, prazo ou recurso.

NOME DO USUÁRIO: ${userName || 'não informado'}
ETAPA ATUAL DO FUNIL: ${step || 'freeChat'}`;

    const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-14) : [];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Lovable-API-Key': LOVABLE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.6-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'ashley_decision', strict: true, schema: DECISION_SCHEMA },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      const status = response.status === 429 || response.status === 402 ? response.status : 500;
      return new Response(
        JSON.stringify({
          error: `AI Gateway error: ${response.status}`,
          intent: 'smalltalk',
          title_query: '',
          plan_id: 'none',
          next_step: 'freeChat',
          reply:
            status === 429
              ? 'Tô com muita gente falando comigo agora, me manda de novo em uns segundinhos?'
              : 'Deu uma instabilidade aqui do meu lado. Pode repetir sua última mensagem?',
        }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    let decision: Record<string, unknown> = {};
    try {
      decision = JSON.parse(raw);
    } catch {
      console.error('Failed to parse decision JSON:', raw.slice(0, 400));
      decision = {};
    }

    const result = {
      intent: typeof decision.intent === 'string' ? decision.intent : 'smalltalk',
      title_query: typeof decision.title_query === 'string' ? decision.title_query.trim() : '',
      plan_id: typeof decision.plan_id === 'string' ? decision.plan_id : 'none',
      next_step: typeof decision.next_step === 'string' ? decision.next_step : 'freeChat',
      reply:
        typeof decision.reply === 'string' && decision.reply.trim()
          ? decision.reply.trim()
          : 'Me conta um pouco mais do que você quer assistir que eu te ajudo agora.',
    };

    // Legacy field kept so older clients keep working.
    return new Response(JSON.stringify({ ...result, response: result.reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ashley chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        intent: 'smalltalk',
        title_query: '',
        plan_id: 'none',
        next_step: 'freeChat',
        reply: 'Tive um probleminha técnico agora. Me diz de novo o que você quer assistir?',
        response: 'Tive um probleminha técnico agora. Me diz de novo o que você quer assistir?',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
