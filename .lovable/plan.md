# Ashley com IA de verdade + site animado com copy de venda

O problema central: hoje o chat decide o que fazer com expressões regulares (listas de palavras). Isso quebra quando o usuário fala "vc tem Round 6", "queria ver aquele do Vin Diesel", "boa noite, tem esse tal de Duna 2". Resultado: ela responde que não tem, mesmo tendo. Além disso o texto está com emoji em excesso e caracteres quebrados, e várias seções da página ainda são estáticas.

## 1. Cérebro do chat: IA decide, não regex

Trocar a decisão por palavra-chave por uma **camada de raciocínio na IA**, na Edge Function `ashley-chat`:

- A IA passa a receber a mensagem + histórico + estado atual e retorna, em formato estruturado, sua decisão: qual a intenção (título de catálogo, plano, dúvida, objeção, conversa solta), qual o título extraído (quando houver, já normalizado — "aquele do Vin Diesel" -> "Velozes e Furiosos"), qual a resposta em texto e qual o próximo passo do fluxo.
- O front deixa de adivinhar: ele apenas executa o que a IA decidiu (buscar no catálogo, apresentar plano, mandar comprovante, seguir conversando).
- Modelo com raciocínio real e resposta rápida, chamado por streaming para não estourar tempo.

Ganho prático: qualquer forma de perguntar por um filme é entendida, inclusive com erro de digitação, apelido, nome em inglês ou frase enrolada.

## 2. Busca de catálogo que não erra mais

- A busca no TMDB passa a usar o título limpo pela IA, não o texto cru sem palavras removidas.
- Cascata de tentativas: busca em português, depois em inglês, depois busca por pessoa (ator/diretor) e por termo aproximado.
- Só diz "não achei" depois de todas as tentativas falharem — e mesmo nesse caso oferece 3 sugestões parecidas em vez de encerrar.
- Quando encontra, mostra pôster, ano, nota e um gancho de venda ("está no catálogo, libero seu acesso hoje").

## 3. Limpeza de texto e emoji

- Sanitizador único aplicado a tudo que a Ashley escreve: no máximo 1 emoji por mensagem, remoção de markdown, de caracteres de controle e de qualquer sequência quebrada (mojibake).
- Revisão das mensagens fixas do fluxo para tom de vendedora humana, sem enfeite.

## 4. Copy de venda

- Reescrita das mensagens do funil (saudação, apresentação do mensal, subida para trimestral/anual, quebra de objeção, fechamento) com estrutura de venda: dor, prova, oferta, urgência real, chamada única.
- Mesma reescrita nas seções da página: hero, planos, prova social e bloco de fechamento — foco em benefício concreto, não em adjetivo.

## 5. Animação de ponta a ponta

- Padronizar a entrada animada em **todas** as seções (inclusive as que ficaram de fora: prova social, FAQ, rodapé, bloco de fechamento).
- Transições de estado no chat: bolha entrando, indicador de digitação, card de plano e de comprovante com entrada própria.
- Micro-interações nos botões de compra e nos cards de catálogo.
- Respeito a `prefers-reduced-motion`.

## Detalhes técnicos

- `supabase/functions/ashley-chat/index.ts`: virar roteador de intenção com saída estruturada (schema estrito) + resposta de texto; manter chave no servidor; tratar 429/402 com mensagem clara na UI.
- `src/components/AshleyChat.tsx`: remover `looksLikeCatalogIntent`, `isPlanIntent`, `stripCatalogQuery` e `findRequestedPlan` como fonte de decisão; passar a consumir a decisão da IA na máquina de estados/fila já existente.
- `supabase/functions/tmdb/index.ts`: novo modo de busca em cascata (multi pt-BR -> multi en-US -> search/person -> sugestões), com filtro de pôster e ordenação por popularidade.
- Sanitizador de texto em `src/lib/` reaproveitado pelo chat.
- `AnimatedSection` aplicado nas seções restantes; variantes de entrada nas bolhas e cards do chat.
