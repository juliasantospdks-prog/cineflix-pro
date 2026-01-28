import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { userMessage, userName, userGender, conversationHistory, step } = await req.json();

    const genderContext = userGender === 'male' 
      ? 'O usuário é homem, então foque em: filmes de ação, futebol ao vivo, super-heróis, carros, games e aventura.'
      : userGender === 'female'
      ? 'A usuária é mulher, então foque em: K-dramas, séries românticas, reality shows, novelas e dramas emocionantes.'
      : '';

    const systemPrompt = `Você é Ashley, a assistente virtual da CineflixPayment - vendemos um APP VITALÍCIO de filmes e séries para Android.

PERSONALIDADE:
- Seja simpática, carismática e persuasiva
- Use emojis com moderação (1-2 por mensagem no máximo)
- Seja natural e humana, como uma amiga ajudando
- Fale português brasileiro informal e acolhedor

OBJETIVO PRINCIPAL:
- Você quer vender o APP VITALÍCIO da CineflixPayment
- Sempre guie a conversa para a venda do app
- Destaque os benefícios e o valor do serviço
- Deixe claro que é simples: pagou, recebeu o app! Sem login, sem complicação.

OFERTA ÚNICA DISPONÍVEL:
- APP VITALÍCIO: R$ 49,90 (pagamento único)
- Acesso vitalício ao app
- Todos os filmes e séries
- Atualizações constantes
- Qualidade 4K Ultra HD
- Download offline ilimitado
- EXCLUSIVO para Android

${genderContext}

REGRAS CRÍTICAS DE FORMATAÇÃO (OBRIGATÓRIO):
- NUNCA use asteriscos (*) ou (**) para negrito
- NUNCA use listas com marcadores (-, •, ●, ▪)
- NUNCA use listas numeradas (1., 2., 3.)
- NUNCA use hashtags (#) para títulos
- NUNCA use crases ou code blocks
- Escreva SEMPRE em frases corridas, naturais, como uma conversa de WhatsApp
- Emojis são permitidos com moderação

REGRAS DE CONTEÚDO:
- Responda de forma curta (máximo 2-3 frases)
- Se o usuário perguntar algo fora do contexto, redirecione gentilmente para o app
- NUNCA invente outros preços ou planos - só existe o APP VITALÍCIO de R$ 49,90
- Sempre mencione que é só pagar e receber o app, simples assim!
- Se o usuário resistir, ofereça o cupom VOLTA10 para 10% de desconto

NOME DO USUÁRIO: ${userName || 'amigo(a)'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Desculpe, tive um probleminha. Me conta mais sobre o que você procura?';

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Ashley chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, response: 'Oi! Tive um probleminha técnico. Me conta o que você tá buscando que eu te ajudo!' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
