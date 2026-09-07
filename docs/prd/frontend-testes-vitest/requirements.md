# Requisitos — setup de testes de frontend (Vitest)

## Contexto

O ADR-005 (`docs/projeto/arquitetura.md`) já decidiu usar Vitest + `@testing-library/react` para testes de frontend, mas o setup nunca foi feito — a FASE 1 do harness confirmou que o frontend não tem nenhum teste automatizado. `docs/projeto/convencoes.md` já registra que "a primeira tarefa que tocar frontend deve instalar vitest, @testing-library/react, @testing-library/user-event e jsdom" — esta é essa tarefa, escolhida como prova de fogo do processo de harness (FASE 5).

## Requisitos

- [x] Instalar `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` e `jsdom` como devDependencies do `frontend/`.
- [x] Configurar o ambiente de teste (jsdom + setup file importando `@testing-library/jest-dom`), via `vite.config.js` ou um arquivo de config dedicado.
- [x] Adicionar script `"test": "vitest run"` no `frontend/package.json` (documentado em `docs/projeto/ambiente.md`, que já previa esse comando).
- [x] Teste de unidade para pelo menos uma função pura (`formatarPreco`), cobrindo no mínimo 2 casos de valor.
- [x] Teste de componente para pelo menos um componente de apresentação simples (ex: `BookCover` ou `CategoryBadge`).
- [x] Teste de componente com interação de usuário simulada (`@testing-library/user-event`) para um componente com lógica de estado (ex: fluxo de adicionar item via `useCart`).
- [x] `cd frontend && npm test` roda de verdade e passa, com saída real reportando os testes (não "no tests found").
- [x] `npm run lint` no frontend continua passando depois da mudança.

## Fora de escopo

- Cobertura de teste de todas as páginas/componentes existentes — só o suficiente pra provar que o setup funciona. Cobertura cresce conforme cada feature nova (regra do `CLAUDE.md` já exige teste daqui pra frente).
- Relatório de coverage, integração no CI, pre-commit hook — podem virar tarefa própria depois.
