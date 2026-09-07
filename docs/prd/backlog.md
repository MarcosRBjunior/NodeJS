# Backlog de features

Candidatas já validadas com o usuário, ainda sem `requirements.md`/`test-plan.md` próprios. Cada uma vira uma pasta em `docs/prd/<tarefa>/` (copiando `docs/prd/_template/`) quando for priorizada e encarada de verdade — este arquivo é só a fila, não substitui o processo da FASE 4.

- [ ] **Estoque real** — hoje `StockGateway.consultarEstoque` (`src/gateways/stock.gateway.js`) sempre retorna `true` (mock fixo). Falta controle de estoque de verdade: coluna/tabela de quantidade por livro, decremento na venda, e o `Conflito` (409) já existente passar a disparar de verdade quando acabar o estoque.
- [ ] **Pagamento real** — hoje `/vendas` só calcula e persiste o valor com desconto (`VendaCalculadora`), sem processar pagamento de fato. Falta integrar um gateway de pagamento (ou um mock mais realista com estados de pendente/aprovado/recusado).

Anotado em 2026-09-07, pendente pra próxima sessão.
