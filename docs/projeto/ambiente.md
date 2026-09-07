# Ambiente

Comandos abaixo foram **rodados de verdade** (não presumidos) durante a FASE 1 do harness, em 2026-09-06, por agentes independentes sem contexto prévio. Veja `docs/harness/fase-1-scan.md` para o relatório completo.

## Pré-requisitos

- Node.js 22 (ESM nativo, `--env-file`, `node:test`)
- Docker + Docker Compose (Postgres 18 em container)
- Portas usadas: `3000` (API), `5173` (frontend Vite dev), `5436` (Postgres, mapeada do `5432` do container)

## Banco de dados

```bash
docker compose up -d        # sobe Postgres; schema criado automaticamente (docker/init/*.sql)
docker compose ps           # confirma bordeless-postgres healthy
```

⚠️ **Nunca rode `docker compose down -v`** sem confirmar antes — isso apaga o volume e os dados de seed reais. Recriar o schema do zero (ex: depois de mudar `docker/init/01-create-tables.sql`) é `docker compose down -v && docker compose up -d`, mas isso é destrutivo e deve ser uma decisão explícita, não automática.

## Backend

```bash
npm install
cp .env.example .env
cp .env.example .env.test   # depois aponte DATABASE_URL pro banco "test" e ajuste PORT/NODE_ENV

npm start                   # roda em http://localhost:3000 (usa .env)
npm run dev                 # com --watch

npm run lint                # ESLint — deve ficar limpo (0 avisos)

npm run test:unit           # sem banco
npm run test:integration    # precisa do Postgres rodando (banco "test")
npm run test:e2e            # idem
npm test                    # os três em sequência
```

Resultado esperado (validado na FASE 1): `npm test` → 29 testes, 28 pass, 1 `todo` intencional (validação de e-mail de editora), 0 fail.

## Frontend

```bash
cd frontend
npm install

npm run dev                 # http://localhost:5173, consome a API em VITE_API_URL (default http://localhost:3000)
npm run build                # gera dist/ — validado: ~177ms, bundle único ~251KB JS / 8KB CSS
npm run lint                 # oxlint — passa com 3 warnings tolerados (set-state-in-effect x2, only-export-components x1)
npm test                     # Vitest — a criar (ver convencoes.md, ADR-005); ainda não existe no repo
```

O frontend espera a API rodando em `http://localhost:3000` (CORS já habilitado no backend via `cors()`).

## Prova de QA (ferramenta obrigatória)

Para features web, a prova de que um item do test-plan funciona é feita com **`claude-in-chrome`** (navegador real: navegar, clicar, digitar, screenshot, ler request de rede, ler console) — ver ADR-006 em `arquitetura.md`. Não conta como prova: chamada de API via `curl`/script isolado sem passar pela UI, teste automatizado mockado, ou inferência sem executar nada.

Fluxo típico de verificação usado nesta sessão (checkout de carrinho): navegar até a página do livro → clicar em "Adicionar ao carrinho" → conferir badge/mensagem de confirmação → ir ao carrinho → escolher forma de pagamento → clicar em "Finalizar compra" → conferir tela de confirmação → `curl http://localhost:3000/vendas` pra confirmar a persistência real no banco.

## Estado observado do banco na FASE 1

- Banco `bordeless`: 6 livros de seed (3 Tecnologia, 3 Idiomas), sem fotos de capa (`capa_url` null — aguardando fotos reais do usuário).
- Banco `test`: existe (criado via `TEMPLATE`), populado/truncado conforme os testes rodam.
