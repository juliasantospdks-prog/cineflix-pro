import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    hooks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', description: 'Same id received for this title.' },
          logline: {
            type: 'string',
            description:
              'Narrativa curta em pt-BR (1 a 2 frases, no máximo 210 caracteres) que conta o conflito do título em tom de cinema e cria desejo. Sem spoiler do final, sem emoji, sem markdown.',
          },
          desire: {
            type: 'string',
            description:
              'Uma frase curta (máximo 90 caracteres) ligando a experiência ao momento do usuário, tipo "hoje à noite, na sua TV, em 4K". Sem emoji.',
          },
        },
        required: ['id', 'logline', 'desire'],
      },
    },
  },
  required: ['hooks'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { titles } = await req.json();
    const list = Array.isArray(titles) ? titles.slice(0, 4) : [];
    if (!list.length) {
      return new Response(JSON.stringify({ hooks: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const catalog = list
      .map(
        (t: Record<string, unknown>) =>
          `id: ${t.id}\ntítulo: ${t.title}\nano: ${t.year ?? 'desconhecido'}\nsinopse: ${String(t.overview || 'sem sinopse')
            .slice(0, 400)}`
      )
      .join('\n---\n');

    const systemPrompt = `Você é roteirista de trailers da CineflixPayment. Para cada título recebido, escreva uma micro-narrativa de venda em português brasileiro.

REGRAS:
- Conte o conflito central como se fosse a locução de um trailer: situação, virada, tensão.
- Crie desejo de assistir AGORA. Nunca revele o final.
- Se a sinopse estiver vazia, use o que se sabe do título.
- Proibido: emoji, asterisco, markdown, hashtag, aspas decorativas, exclamação em excesso.
- Nunca invente preço ou prazo.`;

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
          { role: 'user', content: `Títulos:\n${catalog}` },
        ],
        temperature: 0.9,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'movie_hooks', strict: true, schema: SCHEMA },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      const status = response.status === 429 || response.status === 402 ? response.status : 500;
      return new Response(JSON.stringify({ hooks: [], error: `AI Gateway error: ${response.status}` }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    let parsed: { hooks?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('Failed to parse hooks JSON:', String(raw).slice(0, 300));
    }

    const hooks = Array.isArray(parsed.hooks) ? parsed.hooks : [];
    return new Response(JSON.stringify({ hooks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('movie-hooks error:', error);
    return new Response(JSON.stringify({ hooks: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
