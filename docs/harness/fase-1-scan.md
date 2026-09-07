# FASE 1 — SCAN do projeto `bordeless`

> Status: **aguardando aprovação**. Gerado em 2026-09-06 por 3 agentes independentes (sem contexto prévio da conversa), um pra cada área: backend, frontend, infra/CI. Cada agente rodou os comandos de verdade (não presumiu resultado); nada foi consertado.

---

## 1. Stack

| Camada | Stack |
|---|---|
| **Backend** | Node.js 22 (ESM puro), Express 5, Knex 3 (query builder, não é ORM completo), driver `pg` 8, PostgreSQL 18, `cors`, ESLint 9 (flat config), test runner nativo `node:test` + `supertest` |
| **Frontend** | React 19 (function components/hooks), Vite 8, `react-router-dom` 7, `oxlint` (linter em Rust, substitui ESLint), CSS global puro (sem framework/CSS-in-JS/Sass) |
| **Infra** | Docker Compose com um serviço Postgres 18, schema via SQL puro em `docker/init/`, variáveis via flag nativa `--env-file` do Node (sem `dotenv`), CI no GitHub Actions com 3 jobs paralelos |

Nenhum TypeScript, nenhum ORM completo, nenhuma lib de state management externa no front, nenhum framework de teste no front.

## 2. Arquitetura e camadas

### Backend — fluxo de uma requisição

```
server.js (injeta gateways reais) → app.js (cors, json, rotas, 404, erro)
  → routes/*.routes.js (instancia Service+Controller 1x no boot)
    → controller (valida entrada, chama service, ou monta query e faz next())
      → service (orquestra model+gateway+domain, sem Express)
        → domain (regra pura) / model (Knex, RepositorioBase) / gateway (email, estoque)
  → manipuladorDeErros (mapeia ErroBase e códigos Postgres pra status HTTP)
```

Ponto notável: a paginação roda **depois** do controller na cadeia de rota — o controller só monta o query builder (`req.consultaPaginavel`), sem executar; quem de fato clona/pagina/ordena/executa é o middleware `paginar` (genérico, reusado em Autores/Editoras/Livros/Vendas).

Injeção de dependência: só existe pra gateways externos (email/estoque — mockáveis em teste). A conexão do banco é um singleton (`obterConexao()`) importado direto em cada arquivo de rota — o banco é sempre real, inclusive em testes de integração/e2e.

### Frontend — arquitetura

SPA simples: `App.jsx` define layout fixo (Header/main/Footer) com 5 rotas (`/`, `/catalogo`, `/livros/:id`, `/carrinho`, `/admin`). `pages/*` busca dados e gerencia loading/erro localmente; `components/*` é puramente apresentacional. Carrinho é Context API + `localStorage` (estado efêmero de sessão, só vira transação real no backend no momento do checkout). `useLookups` resolve nome de autor/editora no cliente (dois fetches de até 100 registros cada), porque a API não faz join.

### Infra

Um serviço Postgres com healthcheck (`pg_isready`), schema criado uma única vez via `docker-entrypoint-initdb.d` (`01-create-tables.sql` + `02-create-test-db.sql`, este último cria o banco `test` como `CREATE DATABASE test WITH TEMPLATE bordeless`). O CI replica o mesmo SQL via `psql` contra um serviço Postgres descartável do GitHub Actions (não usa testcontainers).

## 3. Convenções de código

- **Nomenclatura**: domínio de negócio em **português** (`cadastrarLivro`, `validarObrigatorios`, `consultaPaginavel`) tanto no back quanto no front; vocabulário de padrão de projeto em **inglês** (`Service`, `Controller`, `Gateway`, nomes de componentes React como `Home`, `BookCard`).
- **Backend**: um sufixo de arquivo por camada (`.routes.js`, `.controller.js`, `.service.js`, `.gateway.js`, `.config.js`); alias de import via campo nativo `imports` do `package.json` (`#controllers/`, `#services/`, etc — sem bundler); hierarquia de erro `ErroBase → RequisicaoIncorreta/NaoEncontrado/Conflito` com método `enviarResposta(res)`; validação via funções puras (`validarObrigatorios`, `validarNumeroPositivo`), sem Zod/Joi; `RepositorioBase` como Active Record simplificado sobre Knex.
- **Frontend**: só function components (`export function X`, nunca default exceto `App.jsx`); padrão repetido de 3 estados por página (`carregando`/`erro`/dado) resolvido manualmente em `useEffect`, sem lib de data-fetching; formulários controlados manualmente, sem Formik/RHF; CSS único (`styles.css`) com custom properties e nomenclatura BEM-like em português.

## 4. Padrão de teste

- **Backend**: pirâmide real — `test/unit` (lógica pura, sem I/O), `test/integration` (model+banco real, controller+service mockado, service+banco real+gateways mockados), `test/e2e` (Supertest + banco real). `test/support` centraliza factories (`fabricas.js`) e mocks. Todas as suítes de integration/e2e truncam tabelas em `beforeEach` e rodam com `--test-concurrency=1` porque compartilham a mesma conexão/banco `test`.
- **Frontend**: **nenhum teste automatizado existe** — sem test runner, sem arquivo `*.test.*`/`*.spec.*`. Gap real identificado pelo scan.

## 5. Comandos — rodados de verdade (não presumidos)

| Comando | Escopo | Resultado real |
|---|---|---|
| `npm install` | backend / frontend | ✅ ambos, já instalados e sincronizados |
| `npm run lint` | backend (ESLint) | ✅ limpo, 0 avisos |
| `npm run lint` | frontend (oxlint) | ✅ passa, com 3 warnings tolerados: `set-state-in-effect` em `BookDetail.jsx:20` e `Catalog.jsx:22`, `only-export-components` em `CartContext.jsx:60` (não bloqueiam build/CI) |
| `npm run test:unit` | backend | ✅ 7/7 |
| `npm run test:integration` | backend | ✅ 17/17 (Postgres real, já `healthy`) |
| `npm run test:e2e` | backend | ✅ 28 pass, 1 `todo` intencional (validação de e-mail de editora, pendência conhecida) |
| `npm test` | backend | ✅ 29 testes, 28 pass, 1 todo, 0 fail |
| `npm run build` (`vite build`) | frontend | ✅ 177ms, bundle único 251KB JS / 8KB CSS (sem code-splitting) |
| `npm start` / `npm run dev` | ambos | Já estavam rodando (porta 3000 e 5173 respondendo); agentes não subiram segunda instância, só confirmaram via curl |
| `docker compose config` / `ps` | infra | ✅ válido; `bordeless-postgres` healthy há ~18min |

**Nenhum comando falhou** — ambiente já estava íntegro.

## 6. Estado atual verificado no banco

- `bordeless-postgres` healthy, schema de `livros` bate exatamente com `01-create-tables.sql`.
- Banco `bordeless`: **6 livros** (seed real, intacto).
- Banco `test`: existe (criado via TEMPLATE), com 1 registro residual de execução anterior — não foi tocado por esta varredura.

## 7. Divergências e achados

1. **README vs CI real**: o README descreve lint/unit/integration/e2e como se fosse uma sequência; na prática são **3 jobs paralelos e independentes** (sem `needs:`) — lint quebrado não bloqueia os testes.
2. **README não deixa claro** que o banco `test` já é criado automaticamente no primeiro `docker compose up` (leitor pode achar que precisa criar manualmente).
3. **Frontend inteiro ainda não versionado** — `git status` mostra `frontend/` como untracked, zero commits.
4. **Falso-positivo esclarecido**: o agente de frontend apontou que o carrinho manda `preco * quantidade` (valor cheio, sem desconto) pro `POST /vendas` como possível bug de dessincronia. Cruzando com o agente de backend: **não é bug** — é o contrato da API por design (`VendaCalculadora.calcularValorFinal` recebe o valor bruto e aplica o desconto no backend, persistindo o valor líquido). Já validado ponta a ponta nesta sessão (PIX 8% sobre R$89,90 → R$82,71 persistido no banco). Fica registrado como exemplo prático de por que a Fase 2 (perguntar em vez de inferir) importa.

## 8. Decisões técnicas e motivo aparente

| Decisão | Motivo aparente | Evidência |
|---|---|---|
| Knex em vez de ORM completo | Preferência por controle explícito de query; projeto descartou explicitamente um repositório-irmão baseado em Sequelize por ser "domínio totalmente diferente" | README, seção "De onde veio cada parte" |
| Classes de erro customizadas + tradução de códigos Postgres | Corrige bug documentado de um projeto anterior (FK inexistente retornava 500 em vez de 400) | README, mesma seção |
| `--test-concurrency=1` em integration/e2e | Suítes truncam o mesmo banco de teste compartilhado | README + código (`TRUNCATE` em todo `beforeEach`) |
| Banco de teste como `TEMPLATE` do banco dev | Garantir schema sempre idêntico sem duplicar SQL | Comentário em `02-create-test-db.sql` |
| Alias de import `#` nativo do Node | ESM puro sem bundler; usa mecanismo nativo em vez de lib de alias | Inferência (sem comentário explícito) |
| DI só para gateways, não pra conexão de banco | Testes de integração/e2e usam banco real; só side-effects não-determinísticos (email/estoque) são mockados | Inferência a partir do desenho consistente do código |
| CI recria Postgres como serviço descartável (não testcontainers) | Simplicidade, reuso do mesmo SQL do compose local, sem dependência nova | Inferência (ausência de testcontainers no `package.json`) |
| SPA com Vite, sem SSR | Projeto pequeno de estudo, sem necessidade de SEO | Inferência (README do frontend ainda é o template padrão do Vite) |
| `oxlint` em vez de ESLint no frontend | Padrão do scaffold `create-vite` atual, não migração deliberada | Inferência |
| Carrinho em `localStorage`, não no backend | Backend não expõe rota de carrinho, só `/vendas`; carrinho é estado de UI pré-checkout | Inferência a partir da API exposta |
| Nomes de autor/editora resolvidos no cliente (`useLookups`) | API é REST "cru" sem endpoints de agregação/join | Inferência a partir do contrato da API |

---

## Próximo passo

Aguardando sua aprovação deste scan pra seguir pra **FASE 2 — Perguntas** (até 5 "porquês" que não dá pra inferir lendo código).
