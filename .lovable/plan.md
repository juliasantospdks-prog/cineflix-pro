
## O que muda

### 1. Voz customizada (ElevenLabs Voice Design)

Vou usar o endpoint `text-to-voice/create-previews` da ElevenLabs pra criar uma voz permanente com prompt em inglês descritivo:

> "Young Brazilian woman, 19 years old, from Maranhão (Northeast Brazil), sweet warm tone, natural conversational speech, friendly customer support voice, subtle Northeast accent, empathetic"

Gero 3 previews, escolho o melhor, salvo como voz permanente e uso o `voice_id` dela pra gravar **todos os áudios pré-gravados** do funil (10 clipes ao invés de 3):

- `greeting.mp3` — saudação inicial
- `querido.mp3` / `querida.mp3` — reação ao nome
- `pitch-mensal.mp3` / `pitch-trimestral.mp3` / `pitch-anual.mp3` / `pitch-apk.mp3` — apresentação de cada plano
- `comparacao.mp3` — "compara aí com Netflix, Prime, HBO…"
- `upsell.mp3` — oferta de adicionais
- `comprovante.mp3` — narração dos dados de acesso

Modelo `eleven_multilingual_v2`, stability 0.4, similarity_boost 0.85, style 0.55, speaker_boost on — perfil de conversa natural, não robótico. Todos texto em pt-BR.

### 2. Bolhas WhatsApp-style dentro do chat

Reestruturo a área de mensagens (o modal externo continua no visual CineflixPayment — dark + vermelho):

- **Fundo do chat**: textura sutil WhatsApp-dark (grafite com padrão pontilhado esmaecido)
- **Bolha da Ashley** (recebida): cinza-grafite `#1F2C34`, cauda no canto inferior esquerdo, timestamp cinza + avatar circular
- **Bolha do usuário** (enviada): verde WhatsApp adaptado ao tema (`#005C4B` com sombra), cauda direita, dois ✓✓ azuis
- **Bolha de áudio**: play/pause redondo grande, **waveform animado real** (barras que pulsam durante playback), tempo decorrido "0:07 / 0:23", velocidade 1x/1.5x/2x, indicador "áudio não ouvido" (bolinha azul)
- Animação de entrada tipo WhatsApp (slide+fade)
- Data separator "HOJE" no topo

### 3. Planos com áudio + comparação com concorrentes

Cada plano vira uma sequência dentro do chat:
1. Ashley manda **áudio pré-gravado** com o pitch do plano
2. Aparece o **card do plano** (mantém visual atual, com micro-melhorias)
3. Aparece um **card comparativo** logo abaixo mostrando:

```
   COMPARE COM O QUE VOCÊ JÁ PAGA:
   Netflix Premium ......... R$ 59,90/mês
   Amazon Prime ............ R$ 19,90/mês
   HBO Max ................. R$ 34,90/mês
   Globoplay ............... R$ 29,90/mês
   Disney+ ................. R$ 33,90/mês
   ─────────────────────────────────────
   TOTAL SEPARADO .......... R$ 178,50/mês
   
   ✨ CineflixPayment ...... R$ 29,90/mês
   TUDO JUNTO + futebol + APK
   VOCÊ ECONOMIZA R$ 148,60/mês
```

Card com gradiente cinema, animação de contagem no "economiza", ícone de cada concorrente esmaecido.

### 4. Comprovante 100% dentro do chat

Removo a navegação pra `/comprovante`. No lugar:

1. Ashley manda áudio "aqui está seu comprovante, querido/querida"
2. **Card de comprovante inline** no chat (bolha especial larga):
   - Header CineflixPayment com logo
   - Nº do pedido, nome, plano, adicionais, total pago
   - Dados de acesso (usuário/senha/servidor gerados)
   - QR code do app
3. Dois botões abaixo do card:
   - **📄 Baixar PDF** — gera PDF client-side com jsPDF (já instalado) + html2canvas
   - **💬 Enviar no WhatsApp** — abre `wa.me/?text=` com mensagem pronta ("Olá! Aqui está meu comprovante CineflixPayment nº XXX…")
4. Ashley manda mensagem final "Qualquer coisa, é só chamar aqui 💖"

O usuário nunca sai do chat.

## Arquivos que serão tocados

- `src/components/AshleyChat.tsx` — refatorado (bolhas, áudio-player, receipt inline)
- `src/components/AshleyAudioBubble.tsx` — novo (waveform + play)
- `src/components/ChatReceiptCard.tsx` — novo (card + botões PDF/WA)
- `src/components/PlanComparisonCard.tsx` — novo (tabela concorrentes)
- `src/assets/ashley-*.mp3.asset.json` — 10 novos áudios (regeneração completa)
- `src/index.css` — tokens do WhatsApp-style (fundo, bolhas)

## Ordem de execução

1. Gerar voz customizada via API ElevenLabs (Voice Design)
2. Gerar os 10 áudios com a nova voz e subir como assets CDN
3. Construir componentes novos (AudioBubble, ComparisonCard, ReceiptCard)
4. Refatorar AshleyChat integrando tudo
5. Testar fluxo completo com Playwright

## Detalhes técnicos

- Voice Design: `POST /v1/text-to-voice/create-previews` → escolher preview → `POST /v1/text-to-voice/create-voice-from-preview` retorna `voice_id` permanente
- Áudios pré-gravados = zero custo em runtime (só CDN)
- PDF gerado 100% no cliente (jsPDF já está no bundle)
- WhatsApp via `wa.me/?text=` (sem API externa)
- Waveform: 32 barras que animam com `requestAnimationFrame` sincronizado ao `<audio>` currentTime
