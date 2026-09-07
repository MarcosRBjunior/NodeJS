# bordeless

API REST de uma livraria — CRUD de **autores**, **editoras** e **livros**, e registro de **vendas** com desconto por forma de pagamento, verificação de estoque e notificação da editora por email.

## De onde veio cada parte

Este projeto reúne, num único código, a evolução do mesmo exercício em 3 repositórios de estudo separados:

| Repositório | O que contribuiu para o `bordeless` |
| --- | --- |
| [`Teste_E2E`](https://github.com/MarcosRBjunior/Teste_E2E) | Esqueleto do projeto: arquitetura em camadas (`domain/gateways/services/controllers/routes`) sobre PostgreSQL + Knex, injeção de dependência ponta a ponta e a pirâmide de testes (unit/integration/e2e) com `node:test` + Supertest. |
| [`API-validation`](https://github.com/MarcosRBjunior/API-validation) | Tratamento de erro centralizado (`ErroBase`/`RequisicaoIncorreta`/`NaoEncontrado`) e paginação — portados de Mongoose para Postgres/Knex. |
| [`BibliotecaCrud`](https://github.com/MarcosRBjunior/BibliotecaCrud) | Conceito de busca de livros por filtro, adaptado ao schema relacional em `GET /livros/busca`. |

Um quarto repositório, [`API_Sequelize`](https://github.com/MarcosRBjunior/API_Sequelize), foi avaliado mas **não** foi incorporado aqui: é um exercício de domínio totalmente diferente (matrícula escolar — Pessoas/Cursos/Categorias/Matrículas via Sequelize), sem relação com livraria além de usar Node/Express. Ele continua existindo como projeto independente no GitHub.

A junção não foi só colar pastas lado a lado: os controllers, que faziam `try/catch` + `res.status(500)` ad hoc, passaram a delegar para o middleware central de erros; e dois bugs conhecidos do `Teste_E2E` original (`autor_id`/`editora_id` inexistentes retornando 500 em vez de 400) foram resolvidos de graça pela convergência com o tratamento de erro do `API-validation` — a constraint de FK do Postgres agora é traduzida para `400` (veja `src/middlewares/manipuladorDeErros.js`).

## Arquitetura

```text
HTTP request
  │
  ├─► routes          → Express Router, liga controller a service
  │
  ├─► controller       → tradução req/res, validação de entrada, next(erro)
  │         │
  │         └─► service         → orquestra models + gateways,
  │                                não conhece Express
  │                  │
  │                  ├─► domain           → regras de negócio puras
  │                  │                       (cálculo de desconto)
  │                  │
  │                  ├─► model             → Knex query builder
  │                  │
  │                  └─► gateway           → sistemas externos
  │                                          (email, estoque — mockados em teste)
  │
  └─► manipuladorDeErros → mapeia erros customizados e códigos do Postgres
                            para status HTTP corretos
```

```text
src/
  server.js, app.js       # bootstrap e factory do Express (injeta gateways)
  config/, db/             # configuração e conexão com Postgres (Knex)
  domain/                  # regras de negócio puras (sem I/O)
  gateways/                # integrações externas (email, estoque)
  erros/, middlewares/     # classes de erro + tratamento central + paginação
  models/, services/, controllers/, routes/   # Autores, Editoras, Livros, Vendas

test/
  unit/           # lógica pura, sem banco, sem HTTP
  integration/    # camadas se comunicando (model+banco, controller+service mockado)
  e2e/            # HTTP real via Supertest, banco de teste real
  support/        # fábricas de dados, mocks e utilitários de teste
```

## Endpoints

| Recurso | Método | Rota | Descrição |
| --- | --- | --- | --- |
| Autores | GET | `/autores` | Lista autores (paginação: `?limite=&pagina=&ordenacao=coluna:asc\|desc`) |
| Autores | GET | `/autores/:id` | Busca um autor pelo id |
| Autores | POST | `/autores` | Cadastra um autor (`nome`, `nacionalidade`) |
| Editoras | GET | `/editoras` | Lista editoras (paginação) |
| Editoras | GET | `/editoras/:id` | Busca uma editora pelo id |
| Editoras | POST | `/editoras` | Cadastra uma editora (`nome`, `cidade`, `email`) |
| Livros | GET | `/livros` | Lista livros (paginação) |
| Livros | GET | `/livros/busca` | Filtra por `titulo`, `autor_id`, `editora_id`, `minPaginas`, `maxPaginas`, `categoria` (paginação) |
| Livros | GET | `/livros/:id` | Busca um livro pelo id |
| Livros | POST | `/livros` | Cadastra um livro (`titulo`, `paginas`, `autor_id`, `editora_id`, `preco` opcional, `capa_url` opcional, `categoria` opcional) |
| Vendas | GET | `/vendas` | Lista vendas (paginação) |
| Vendas | GET | `/vendas/:id` | Busca uma venda pelo id |
| Vendas | POST | `/vendas` | Registra uma venda (`idLivro`, `valor`, `modoPagamento`) — aplica desconto, consulta estoque e notifica a editora por email |

Descontos por modo de pagamento: `DINHEIRO` 10%, `PIX` 8%, `BOLETO` 5%, `CARTAO_DEBITO` 3%, `CARTAO_CREDITO` 0%.

## Como rodar

```bash
npm install
cp .env.example .env
cp .env.example .env.test   # depois aponte o DATABASE_URL para o banco "test"

docker compose up -d        # Postgres, com os bancos "bordeless" e "test"
npm start                   # http://localhost:3000
```

## Testes

```bash
npm test                    # unit -> integration -> e2e
npm run lint
```

`test:integration` e `test:e2e` rodam com `--test-concurrency=1`: os arquivos compartilham o mesmo banco de teste Postgres e truncam tabelas entre `it`s, então rodar em série evita condição de corrida entre suítes.

## CI/CD

`.github/workflows/ci.yml` roda em todo push/PR: `lint`, `test:unit` (sem banco), e `test:integration`/`test:e2e` (Postgres descartável como serviço do GitHub Actions, schema criado via `psql` a partir de `docker/init/*.sql`).
