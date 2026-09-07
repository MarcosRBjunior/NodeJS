# Test Plan — setup de testes de frontend (Vitest)

> Preenchido antes de codar, junto com `requirements.md`. Cada item só é marcado por um agente de QA separado (sem contexto do código escrito nesta tarefa), com prova real.
>
> **Nota sobre "prova real" nesta tarefa específica**: isso não é uma feature de UI clicável, então a regra "usa claude-in-chrome" do `CLAUDE.md` não se aplica da mesma forma — o equivalente aqui é **rodar os comandos de teste de verdade e inspecionar o output real do terminal**, incluindo um teste de sanidade (quebrar a implementação de propósito e confirmar que o teste falha) pra provar que os testes não são vácuos. CLI aqui não é "mock" — é o próprio artefato sendo entregue.

## Casos de teste

- [x] **Caso 1 — comando existe e roda**: em ambiente limpo, rodar `cd frontend && npm install && npm test`. Confirmar exit code 0 e que o output reporta pelo menos 3 testes passando (não "no test files found").
- [x] **Caso 2 — teste de função pura é significativo**: abrir o arquivo de teste de `formatarPreco` e confirmar que cobre pelo menos 2 casos de valor (ex: inteiro e com centavos), comparando contra o formato de moeda esperado (`R$ 89,90`), não apenas "não lança erro".
- [x] **Caso 3 — sanidade anti-vácuo**: alterar temporariamente a implementação de `formatarPreco` (ex: remover a formatação de moeda) e rodar `npm test` de novo — confirmar que ele **falha**. Reverter a alteração e rodar de novo — confirmar que volta a passar. Reportar o output de antes e depois.
- [x] **Caso 4 — teste de componente com interação real**: rodar o teste do componente com `userEvent` e confirmar, pelo output E pela leitura do arquivo de teste, que ele de fato simula clique/input (`userEvent.click`/`userEvent.type`) e faz uma asserção sobre o resultado (não é um snapshot vazio ou um `expect(true).toBe(true)`).
- [x] **Caso 5 — lint continua limpo**: rodar `npm run lint` no frontend depois de tudo pronto e confirmar que passa sem novo erro introduzido pelos arquivos de teste.

## Evidência de QA

QA executado do zero em 2026-09-06, sem contexto prévio do código, dentro de `/home/marcos/Downloads/bordeless/frontend`.

### Caso 1 — `npm install && npm test` em ambiente limpo

Removido `node_modules` (`rm -rf node_modules`) e reinstalado do zero:

```
added 112 packages, and audited 113 packages in 900ms
found 0 vulnerabilities
```

`npm test`:

```
> frontend@0.0.0 test
> vitest run

 RUN  v5.0.0 /home/marcos/Downloads/bordeless/frontend

 Test Files  3 passed (3)
      Tests  9 passed (9)
   Start at  23:17:35
   Duration  932ms
EXIT_CODE=0
```

3 arquivos de teste, 9 testes, exit code 0. Critério de "pelo menos 3 testes passando" superado.

### Caso 2 — `src/utils/formatarPreco.test.js` inspecionado

Contém 3 `it` (mais que os 2 exigidos), cada um comparando contra o formato de moeda BRL esperado via regex, não apenas "não lança erro":

```js
it('formata valor inteiro como moeda brasileira', () => {
  expect(formatarPreco(100)).toMatch(/^R\$\s?100,00$/);
});
it('formata valor com centavos', () => {
  expect(formatarPreco(89.9)).toMatch(/^R\$\s?89,90$/);
});
it('aceita valor em formato string numérica (como vem da API)', () => {
  expect(formatarPreco('149.90')).toMatch(/^R\$\s?149,90$/);
});
```

Cobre inteiro, decimal com centavos e string numérica vinda da API — todas comparadas contra o valor de moeda esperado real.

### Caso 3 — sanidade anti-vácuo

Estado inicial confirmado limpo (`git status --short src/utils/formatarPreco.js` sem saída).

Implementação quebrada temporariamente (substituída por `return String(Number(valor));`, sem formatação de moeda). `npm test` rodado de novo:

```
 FAIL  src/utils/formatarPreco.test.js > formatarPreco > formata valor inteiro como moeda brasileira
AssertionError: expected '100' to match /^R\$\s?100,00$/
 FAIL  src/utils/formatarPreco.test.js > formatarPreco > formata valor com centavos
AssertionError: expected '89.9' to match /^R\$\s?89,90$/
 FAIL  src/utils/formatarPreco.test.js > formatarPreco > aceita valor em formato string numérica (como vem da API)
AssertionError: expected '149.9' to match /^R\$\s?149,90$/

 Test Files  1 failed | 2 passed (3)
      Tests  3 failed | 6 passed (9)
EXIT_CODE=1
```

Falhou como esperado (as 3 asserções de `formatarPreco` quebraram; os demais 6 testes de outros arquivos continuaram passando, como esperado).

Revertido com `git checkout -- src/utils/formatarPreco.js`. Confirmado `git diff -- frontend/src/utils/formatarPreco.js` vazio (arquivo idêntico ao commit `60e1784`). `npm test` rodado mais uma vez:

```
 Test Files  3 passed (3)
      Tests  9 passed (9)
EXIT_CODE=0
```

Voltou a passar integralmente.

### Caso 4 — `src/context/CartContext.test.jsx` inspecionado + rodado

O arquivo usa `userEvent.setup()` e `user.click(...)` de verdade (não simula eventos sintéticos manuais), disparando os handlers reais do `CartProvider` via um componente de teste (`PainelDeTeste`) que renderiza `totalItens`, `subtotal` e a lista de itens. As asserções checam resultado real de estado, não placeholders:

```js
const user = userEvent.setup();
...
await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));
expect(screen.getByTestId('total-itens')).toHaveTextContent('1');
expect(screen.getByTestId('subtotal')).toHaveTextContent('129.9');
expect(screen.getByText('Clean Code')).toBeInTheDocument();
```

Há também um caso de duplicação (soma quantidade em vez de duplicar item) e um caso de remoção (`user.click` no botão "Remover" seguido de `expect(...).not.toBeInTheDocument()`). Nenhum `expect(true).toBe(true)` ou snapshot vazio. Os 3 testes deste arquivo estão entre os 9 que passaram na execução do Caso 1.

### Caso 5 — `npm run lint`

```
> frontend@0.0.0 lint
> oxlint

src/pages/Catalog.jsx:22:5: warning react(set-state-in-effect) ...
src/context/CartContext.jsx:60:17: warning react(only-export-components) ...
src/pages/BookDetail.jsx:20:5: warning react(set-state-in-effect) ...
EXIT_CODE=0
```

Exit code 0 (lint passa). As 3 warnings existentes são em código de aplicação pré-existente (`Catalog.jsx`, `CartContext.jsx`, `BookDetail.jsx`), não relacionadas aos arquivos de teste; nenhum erro ou warning aparece em `formatarPreco.test.js`, `CartContext.test.jsx`, `CategoryBadge.test.jsx` ou `setupTests.js`.

### Estado final do repositório

`git status` no repositório raiz, após todo o QA, é idêntico ao estado inicial (mesmas modificações/arquivos untracked de antes de qualquer ação de QA): `frontend/package.json`, `frontend/package-lock.json` e `frontend/vite.config.js` modificados (parte da entrega original), e os arquivos de teste/`setupTests.js`/`docs/prd/...` untracked (também parte da entrega original). `git diff -- frontend/src/utils/formatarPreco.js` retornou vazio — nenhuma alteração residual do Caso 3.
