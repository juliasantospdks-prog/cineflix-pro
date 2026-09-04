# Checkout real da Cakto no chat Ashley

## Objetivo
Conectar a escolha de plano no chat ao checkout da Cakto e transformar o card final em um acompanhamento de pagamento, exibindo pendente, aprovado ou recusado.

## Implementação
- Coletar e validar o e-mail no próprio fluxo da Ashley depois da escolha do plano, reutilizando o nome já informado.
- Criar uma sessão segura de checkout no backend com identificador público aleatório, plano, nome, e-mail, valor e horário de início.
- Retornar ao chat o link real da Cakto correspondente ao plano, com os dados de cliente aceitos pelo checkout.
- Atualizar o webhook existente para relacionar os eventos recebidos da Cakto à sessão correta e normalizar os estados `pending`, `paid` e `refused`.
- Criar uma consulta pública restrita ao identificador aleatório da sessão, sem expor a tabela de vendas ou permitir busca por e-mail.
- Substituir o card de WhatsApp por um card de pagamento com botão para abrir a Cakto e atualização automática de status.
- Exibir “Comprovante aprovado” somente após evento de pagamento aprovado; exibir “Pagamento recusado” quando houver recusa; manter “Aguardando pagamento” enquanto pendente.

## Detalhes técnicos
- A página continuará usando os links Cakto já cadastrados para mensal, trimestral e anual.
- O navegador nunca terá acesso direto aos registros privados de venda; criação e consulta passam por uma função do backend.
- A atualização será feita por consulta periódica enquanto o pagamento estiver pendente e também ao retornar para a aba do chat.
- O card preservará nome, e-mail, plano e total associados à sessão para evitar misturar pagamentos entre clientes.

## Validação
- Testar criação das três sessões de plano e abertura do checkout correto.
- Simular eventos de aprovado e recusado no webhook e confirmar a mudança do card.
- Verificar que um identificador inválido não revela dados de venda.
- Validar o fluxo completo e a renderização do chat no navegador.
