# Arquitetura

## O que é

`bordeless` é uma API REST de livraria (CRUD de autores, editoras e livros, e registro de vendas com desconto por forma de pagamento) somada a um frontend React que a consome: a loja **Library Fast**, especializada em livros de **tecnologia** e **idiomas**.

## Pra quem

Projeto de faculdade que também funciona como peça de portfólio técnico. Isso significa duas coisas na prática:

- O critério de "pronto" é rigor de engenharia **demonstrável** (arquitetura em camadas, testes reais, decisões documentadas), não hardening de produção real (não há, hoje, pagamento de verdade, autenticação, ou preocupação de escala multi-tenant).
- Login de cliente, gestão de estoque real e pagamento real são lacunas conhecidas e aceitas por enquanto — candidatas a entrar como features formais (com `requirements.md` + `test-plan.md` próprios) quando priorizadas.

## Backend — arquitetura em camadas

```
server.js (injeta gateways reais) → app.js (cors, json, rotas, 404, erro)
  → routes/*.routes.js (instancia Service+Controller uma única vez, no boot)
    → controller (valida entrada, chama service, ou monta query e chama next())
      → service (orquestra model+gateway+domain; não conhece Express)
        → domain (regra de negócio pura) / model (Knex, RepositorioBase) / gateway (email, estoque)
  → manipuladorDeErros (mapeia ErroBase e códigos de erro do Postgres pra status HTTP)
```

Duas particularidades do desenho, importantes pra quem for mexer nas rotas:

- **Paginação roda depois do controller.** O controller só monta o query builder (`req.consultaPaginavel`) e chama `next()` — quem de fato clona, ordena, limita/pagina e executa é o middleware genérico `paginar` (`src/middlewares/paginar.js`), reaproveitado em Autores/Editoras/Livros/Vendas.
- **Injeção de dependência é seletiva.** `emailGateway`/`stockGateway` percorrem `server → app → routes → service` como parâmetros (por isso são fáceis de mockar em teste). A conexão com o banco é um singleton (`obterConexao()`) importado direto em cada arquivo de rota — o banco é sempre real, inclusive em testes de integração/e2e; só os side effects externos (email, estoque) são mockados.

## Frontend — arquitetura

SPA em React + Vite, sem SSR. `App.jsx` define um layout fixo (Header/main/Footer) com 5 rotas: `/`, `/catalogo`, `/livros/:id`, `/carrinho`, `/admin`.

- `pages/*` busca dados e gerencia seu próprio estado de carregamento/erro.
- `components/*` é puramente apresentacional (recebe tudo via props, exceto `Header`/`BookCard`, que consomem o contexto do carrinho).
- O carrinho vive em Context API + `localStorage` (`CartContext.jsx`) — é estado efêmero de sessão de compra; só vira transação real no backend no momento do checkout (`POST /vendas`, um por item do carrinho).
- `useLookups` resolve nome de autor/editora no cliente (dois fetches de até 100 registros cada), porque a API não expõe endpoints de agregação/join.
- Estilização é um único `styles.css` global com custom properties como tokens de tema — sem CSS Modules, Tailwind ou CSS-in-JS.

## ADRs (decisões técnicas)

Formato: Contexto → Decisão → Motivo → Trade-offs reconhecidos → Status.

### ADR-001 — Knex como query builder, não um ORM completo

- **Contexto**: o projeto unifica 3 exercícios de estudo anteriores; um deles (`API_Sequelize`) usava Sequelize mas foi avaliado e descartado por ser "um exercício de domínio totalmente diferente" (matrícula escolar), sem relação com o domínio de livraria além de usar Node/Express.
- **Decisão**: usar Knex (query builder) + uma classe `RepositorioBase` própria (Active Record simplificado), em vez de um ORM completo.
- **Motivo**: controle explícito sobre as queries (visível em `Livro.queryComFiltro`, com escaping manual de `LIKE`) e reaproveitamento de um esqueleto de projeto já validado em outro repositório de estudo.
- **Trade-offs reconhecidos**: sem migrations automáticas, sem lazy-loading de relações, sem validação declarativa de schema no nível do ORM — schema é SQL puro em `docker/init/`, e validação é manual (`validarCampos.js`).
- **Status**: aceito.

### ADR-002 — Hierarquia de erros customizada + tradução de códigos do Postgres

- **Contexto**: um projeto de estudo anterior (`Teste_E2E`) tinha um bug conhecido: FK inexistente (`autor_id`/`editora_id`) retornava 500 em vez de 400.
- **Decisão**: `ErroBase` (com `status` e `enviarResposta(res)`) + subclasses (`RequisicaoIncorreta` 400, `NaoEncontrado` 404, `Conflito` 409), e um middleware final que também traduz códigos de erro nativos do driver `pg` (`22P02`, `23502`, `23503`, `23505`) para essas classes.
- **Motivo**: centralizar o formato de resposta de erro e corrigir de vez a classe de bug de "constraint do banco vazando como 500".
- **Trade-offs reconhecidos**: acopla o tratamento de erro HTTP aos códigos específicos do Postgres — trocar de banco exigiria revisar esse mapeamento.
- **Status**: aceito.

### ADR-003 — Recursos nativos do Node em vez de dependências externas, quando o nativo cobre a necessidade

- **Contexto**: o backend usa `node:test` (em vez de Jest) e a flag `--env-file` do Node (em vez de `dotenv`).
- **Decisão**: preferir recursos nativos do runtime a dependências externas sempre que o nativo cobrir a necessidade do projeto.
- **Motivo**: reduzir superfície de manutenção (menos dependências pra atualizar/auditar) e demonstrar fluência com o runtime — sem lib "mágica" no meio, o comportamento é mais previsível.
- **Trade-offs reconhecidos**: `node:test` não tem mocking tão robusto quanto o do Jest, não tem snapshot testing, e seu watch mode é menos maduro; o ecossistema de plugins do Jest também é maior. Essa escolha é adequada para o **tamanho e escopo deste projeto** — não é uma regra universal, e um projeto maior ou com necessidades de mocking mais complexas justificaria reavaliar.
- **Status**: aceito, com escopo explícito (não se aplica automaticamente a decisões futuras de tooling — cada uma deve ser avaliada no contexto, não por dogma).

### ADR-004 — Banco de teste como `TEMPLATE` do banco de desenvolvimento

- **Contexto**: `docker/init/02-create-test-db.sql` cria o banco `test` via `CREATE DATABASE test WITH TEMPLATE bordeless`.
- **Decisão**: gerar o banco de teste como cópia exata da estrutura do banco de dev/produção, em vez de manter um segundo script de `CREATE TABLE`.
- **Motivo**: garantir que os dois bancos tenham sempre o mesmo schema, eliminando o risco de divergência por esquecimento de rodar uma migration duas vezes.
- **Trade-offs reconhecidos**: os testes de integração/e2e compartilham a mesma instância Postgres e a mesma conexão singleton do banco `test` — por isso rodam com `--test-concurrency=1` e truncam tabelas em `beforeEach` (ver `docs/projeto/convencoes.md`).
- **Status**: aceito.

### ADR-005 — Vitest + Testing Library para testes de frontend

- **Contexto**: o frontend (React + Vite) não tinha nenhum teste automatizado até a introdução do processo de harness (2026-09-06). `node:test` nativo não renderiza componentes React/DOM de forma prática.
- **Decisão**: usar Vitest + `@testing-library/react` (com `jsdom`) para testes de unidade/componente do frontend, a partir de agora.
- **Motivo**: integra direto com a config do Vite já existente, tem API compatível com Jest (baixa curva de aprendizado), e é a ferramenta padrão de mercado pra esse tipo de stack — mantém o espírito do ADR-003 (native quando cobre; dependência justificada quando não cobre).
- **Trade-offs reconhecidos**: é uma dependência nova (contraria a preferência por zero-dependência do ADR-003), mas não há alternativa nativa razoável para testar componentes React.
- **Status**: aceito.

### ADR-006 — `claude-in-chrome` como ferramenta de prova de QA

- **Contexto**: o processo de harness (FASE 4) exige que todo item de test-plan seja validado por um agente de QA com prova real de navegador (não mock), citando "o plugin do Playwright". Neste ambiente não há um MCP de Playwright instalado; existe `claude-in-chrome`, que cobre a mesma necessidade (navegar, clicar, ler request de rede, ler console).
- **Decisão**: tratar `claude-in-chrome` como a ferramenta de prova de QA para features web, até que um Playwright MCP dedicado seja instalado (se um dia for).
- **Motivo**: é a única ferramenta de automação de navegador real disponível no ambiente atual; já foi validada nesta sessão (fluxo completo de checkout testado clicando de verdade no navegador, com confirmação via `curl` no banco).
- **Trade-offs reconhecidos**: não é Playwright "puro" (sem test runner de Playwright, sem gravação de vídeo nativa) — mas satisfaz o requisito central da regra (prova real de navegador, não mock).
- **Status**: aceito.
