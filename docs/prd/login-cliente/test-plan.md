# Test Plan — login de cliente

> Preenchido antes de codar, junto com `requirements.md`. Cada item só é marcado por um agente de QA separado, sem contexto do código, com prova real. Esta é uma feature web de verdade — a prova é `claude-in-chrome` (ver ADR-006), não CLI isolada. `curl`/`psql` só entram como evidência complementar (ex: conferir `cliente_id` gravado no banco), nunca como substituto do clique real na UI.

## Casos de teste

- [x] **Registro**: preencher `/registrar` com nome/email/senha válidos e novos → sucesso, fica autenticado, header passa a mostrar o nome do cliente.
- [x] **Registro com email duplicado**: repetir o registro com o mesmo email → erro visível na tela (não trava, não autentica um segundo cliente).
- [x] **Logout + login**: sair e entrar de novo em `/login` com o mesmo email/senha → autentica com sucesso.
- [x] **Login com senha errada**: tentar `/login` com senha incorreta → erro visível, não autentica.
- [x] **`/admin` bloqueado sem login**: deslogado, acessar `/admin` direto pela URL → redirecionado pra `/login`, não vê os formulários de cadastro.
- [x] **`/admin` bloqueado pra cliente comum**: logado com papel `cliente` (default do registro), acessar `/admin` → continua bloqueado.
- [x] **`/admin` liberado pra admin**: promover o cliente a admin via SQL direto (`UPDATE clientes SET papel='admin' WHERE email=...`), logar de novo, acessar `/admin` → agora consegue cadastrar autor/editora/livro pela UI.
- [x] **Checkout bloqueado sem login**: deslogado, com item no carrinho, tentar finalizar compra → redirecionado pra `/login` antes de qualquer `POST /vendas` (conferir na aba de rede que a requisição não saiu).
- [x] **Checkout autenticado grava `cliente_id`**: logado, adicionar item ao carrinho e finalizar compra de verdade → venda é criada; conferir via `psql`/`curl` que o registro em `vendas` tem `cliente_id` igual ao id do cliente logado.
- [x] **Token inválido não trava a aplicação**: adulterar manualmente o token no `localStorage` (via devtools/`claude-in-chrome`) e tentar uma ação autenticada (ex: finalizar compra) → recebe 401, é deslogado/redirecionado, aplicação não quebra.
- [x] **`AuthContext` — teste automatizado**: rodar `npm test` no frontend e inspecionar o arquivo de teste do `AuthContext` — confirmar que login muda `estaAutenticado`/`cliente` de forma observável e logout limpa o estado, com `userEvent` real (mesmo critério de qualidade usado no test-plan anterior, `docs/prd/frontend-testes-vitest/test-plan.md`).

## Evidência de QA

QA executado do zero em 2026-09-07, sem contexto prévio do código, via `claude-in-chrome` navegando de verdade em `http://localhost:5173` (API real em `http://localhost:3000`, Postgres via `bordeless-postgres`). Conta de teste usada: `qa-1788750321@teste.com` / senha `SenhaForte123` (nome inicial "QA Teste Um").

**Nota operacional**: ao abrir a primeira aba, o frontend carregava em branco (`#root` sem filhos, nenhum erro de console). Investigação com `curl` mostrou que os chunks de dependência do Vite (`/node_modules/.vite/deps/react.js` etc.) respondiam `504 Outdated Optimize Dep` — cache de otimização de deps do Vite dessincronizado do processo já rodando. Reiniciei o processo `vite` (mesmo comando `npm run dev`, sem alterar nenhum arquivo de implementação) com `--force` para forçar a re-otimização; depois disso a app carregou normalmente e todos os casos abaixo foram testados no app real.

### Registro
Preenchido `/registrar` com nome "QA Teste Um", email `qa-1788750321@teste.com`, senha `SenhaForte123`. Rede: `POST /auth/registrar` → `201`. Resultado: redirecionado pra `/`, header passou a mostrar "QA Teste Um" + "Sair" no lugar de "Entrar".

### Registro com email duplicado
Deslogado (via "Sair") e repetido `/registrar` com o mesmo email `qa-1788750321@teste.com`, nome/senha diferentes. Rede: `POST /auth/registrar` → `400`. Tela mostrou erro visível "Já existe um registro com esses dados.", header continuou mostrando "Entrar" (não autenticou um segundo cliente).

### Logout + login
Já deslogado do passo anterior, fui a `/login` e entrei com `qa-1788750321@teste.com` / `SenhaForte123` (a senha do registro original). Rede: `POST /auth/login` → `200`. Header voltou a mostrar "QA Teste Um" + "Sair".

### Login com senha errada
Em `/login`, tentei `qa-1788750321@teste.com` com senha incorreta (`SenhaErrada999`). Rede: `POST /auth/login` → `400`. Tela mostrou "E-mail ou senha inválidos.", header continuou "Entrar" (não autenticou).

### `/admin` bloqueado sem login
Deslogado, naveguei direto pra `http://localhost:5173/admin`. A URL mudou sozinha pra `/login` e a tela renderizada foi o formulário de login — nenhum formulário de cadastro (autor/editora/livro) ficou visível.

### `/admin` bloqueado pra cliente comum
Logado como `qa-1788750321@teste.com` (papel `cliente`, default do registro — header mostrando nome, confirmando sessão ativa), naveguei pra `/admin`. Mesmo autenticado, a URL foi redirecionada pra `/login` e a tela mostrada foi a de login, não os formulários de cadastro.

### `/admin` liberado pra admin
Rodado no host: `docker exec bordeless-postgres psql -U postgres -d bordeless -c "UPDATE clientes SET papel='admin' WHERE email='qa-1788750321@teste.com';"` → retornou `UPDATE 1`. Fiz logout na UI e login de novo com as mesmas credenciais (pra pegar token novo com `papel: admin`). Naveguei pra `/admin` → dessa vez a página carregou de verdade com os formulários "Novo autor", "Nova editora" e "Novo livro". Para confirmar que não é só a tela renderizando mas que o backend também libera a escrita, cadastrei um autor de teste ("Autor QA Teste 1788750321" / "Brasileira") pelo formulário: rede `POST /autores` → `201`, e a tela mostrou a confirmação "Autor "Autor QA Teste 1788750321" cadastrado."

### Checkout bloqueado sem login
Deslogado, adicionei "Learning Vocabulary in Another Language" ao carrinho (catálogo permite isso sem login), fui pra `/carrinho` (item visível, badge do carrinho com "1") e cliquei "Finalizar compra". Resultado: redirecionado pra `/login` antes de qualquer chamada — conferido via `read_network_requests` filtrando por `/vendas` que **nenhuma requisição foi feita** (nem `OPTIONS` nem `POST`) até esse ponto. Carrinho manteve o item (badge "1" preservado).

### Checkout autenticado grava `cliente_id`
Logado novamente como `qa-1788750321@teste.com`, item ainda no carrinho, cliquei "Finalizar compra" (forma de pagamento Pix, 8% desconto). Rede: `POST /vendas` → `201`. Tela mostrou "Compra confirmada! 1 item(ns) comprado(s) — total pago: R$ 64,31". Conferido no banco:
```
docker exec bordeless-postgres psql -U postgres -d bordeless -c "SELECT id, nome, email, papel FROM clientes WHERE email='qa-1788750321@teste.com';"
 id |    nome     |          email          | papel
----+-------------+-------------------------+-------
  2 | QA Teste Um | qa-1788750321@teste.com | admin

docker exec bordeless-postgres psql -U postgres -d bordeless -c "SELECT id, livro_id, valor, tipo_pagamento, cliente_id FROM vendas ORDER BY id DESC LIMIT 1;"
 id | livro_id | valor | tipo_pagamento | cliente_id
----+----------+-------+----------------+------------
  1 |        6 | 64.31 | PIX            |          2
```
`cliente_id` da venda (`2`) bate exatamente com o `id` do cliente logado (`2`). Único registro na tabela `vendas`, criado por esta sessão de QA.

### Token inválido não trava a aplicação
Logado, adicionei outro item ao carrinho ("Fluent in 3 Months"). Via `javascript_tool`, corrompi o token: `localStorage.setItem('library-fast:token', 'token-corrompido-invalido-123')` (confirmado: token real começava com `eyJhbGciOiJIUzI...`, virou a string inválida). Fui pra `/carrinho` (app continuou renderizando normalmente, sem tela branca — o nome do cliente em cache ainda aparecia no header porque o estado inicial do `AuthContext` lê o cliente salvo, não valida o token até uma chamada de API) e cliquei "Finalizar compra". Resultado: `POST /vendas` → `401` (conferido via `read_network_requests`); a aplicação tratou o erro, chamou `logout()` e redirecionou pra `/login` automaticamente — header voltou a mostrar "Entrar", `localStorage` ficou com `library-fast:token` e `library-fast:cliente` ambos `null`. Nenhuma tela branca, nenhum erro não tratado no console (`read_console_messages` com `onlyErrors: true` não encontrou nada).

### `AuthContext` — teste automatizado
Rodado `cd frontend && npm test`:
```
 Test Files  4 passed (4)
      Tests  11 passed (11)
```
Inspecionado `frontend/src/context/AuthContext.test.jsx`: usa `userEvent.setup()` e `user.click(...)` reais (não eventos sintéticos manuais) sobre um componente de teste que expõe `estaAutenticado`/`cliente.nome`; mocka apenas `api/client` (a camada HTTP externa), não o próprio `AuthContext`. O teste "autentica o cliente após login com sucesso" clica em "Entrar" e verifica que `estaAutenticado` muda de `'false'` pra `'true'` e o nome aparece; o teste "limpa o estado ao fazer logout" clica em "Sair" depois de logado e verifica que `estaAutenticado` volta a `'false'` e o nome some. Segue o mesmo padrão de qualidade validado no test-plan anterior (asserções sobre estado observável real via `userEvent`, sem `expect(true).toBe(true)` nem mocks do próprio hook sob teste).

### Estado final
Nenhum arquivo de implementação foi alterado durante este QA (apenas este `test-plan.md`). O processo `vite` foi reiniciado (`--force`, cache de deps limpo) para contornar o problema de `504 Outdated Optimize Dep` já descrito acima — isso não altera nenhum arquivo versionado. `git status` mostra as mesmas modificações/arquivos untracked da entrega original da feature (backend/frontend de login-cliente), sem alterações extras introduzidas por este QA.
