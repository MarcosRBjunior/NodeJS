# Requisitos — login de cliente

## Contexto

Até agora a Library Fast não tem nenhum conceito de conta: catálogo é público, checkout é anônimo (qualquer um cria uma venda), e `/admin` (cadastro de autor/editora/livro) está aberto pra qualquer um. Decisões confirmadas com o usuário antes deste documento:

- Checkout passa a **exigir login** — `POST /vendas` autenticado, venda associada ao cliente.
- Sessão via **JWT stateless** (sem tabela de sessão).
- `/admin` passa a exigir login **com papel admin** — `POST /livros`, `/autores`, `/editoras` autenticados e restritos a admin.

Endpoints de leitura (todo GET) continuam públicos — só escrita muda.

## Requisitos

### Backend — dados e segurança

- [x] Nova tabela `clientes` (`id`, `nome`, `email` único, `senha_hash`, `papel` enum `'cliente'|'admin'` default `'cliente'`).
- [x] Nova coluna `vendas.cliente_id` (FK pra `clientes`, nullable no schema pra não quebrar a venda de seed já existente — obrigatória por regra de negócio na API, não por constraint de banco).
- [x] Hash de senha com `crypto.scrypt` nativo do Node (salt aleatório por senha) — sem dependência nova pra isso.
- [x] Geração/verificação de JWT com a lib `jsonwebtoken` (segredo em `JWT_SECRET`, novo em `.env`/`.env.example`/`.env.test`), expiração de 7 dias.
- [x] Novas classes de erro `NaoAutorizado` (401) e `Proibido` (403), seguindo o padrão de `ErroBase`.
- [x] Middleware `autenticar` (valida `Authorization: Bearer <token>`, popula `req.cliente`) e `exigirAdmin` (checa `req.cliente.papel === 'admin'`).

### Backend — endpoints

- [x] `POST /auth/registrar` (`nome`, `email`, `senha`) → cria cliente com papel `cliente`, retorna `{ cliente, token }`.
- [x] `POST /auth/login` (`email`, `senha`) → valida credenciais, retorna `{ cliente, token }`.
- [x] `GET /auth/me` (autenticado) → retorna os dados do cliente do token.
- [x] `POST /vendas` passa a exigir `autenticar`; `cliente_id` vem do token, nunca do body.
- [x] `POST /livros`, `POST /autores`, `POST /editoras` passam a exigir `autenticar` + `exigirAdmin`.

### Frontend

- [x] `AuthContext` (Context API + `localStorage` do token), com `login`, `registrar`, `logout`, `cliente`, `estaAutenticado`.
- [x] Página `/login` e página `/registrar`.
- [x] `api/client.js` envia `Authorization: Bearer <token>` nas chamadas que precisam (`cadastrarLivro`/`Autor`/`Editora`, `registrarVenda`).
- [x] `/admin` só acessível com `cliente.papel === 'admin'` — senão redireciona pra `/login`.
- [x] Finalizar compra no carrinho exige estar logado — se não estiver, redireciona pra `/login` antes de tentar `POST /vendas`.
- [x] Header mostra "Entrar" (deslogado) ou nome do cliente + "Sair" (logado).
- [x] Teste automatizado (Vitest + RTL) pro `AuthContext` — login muda o estado observável, logout limpa — seguindo a convenção de `docs/projeto/convencoes.md`.

### Dados / operação

- [x] Documentar em `docs/projeto/ambiente.md` como promover um cliente existente a admin (`UPDATE clientes SET papel = 'admin' WHERE email = '...'`) — não existe fluxo de UI pra isso.

## Fora de escopo

- Recuperação de senha / "esqueci minha senha".
- Refresh token / revogação de sessão antes da expiração.
- Histórico de pedidos do cliente (listar vendas filtradas por `cliente_id`).
- Fluxo de convite/promoção de admin via UI.
- OAuth / login social.
