# Convenções de código

## Nomenclatura

Domínio de negócio em **português** (`cadastrarLivro`, `validarObrigatorios`, `consultaPaginavel`), tanto no backend quanto no frontend. Vocabulário de padrão de projeto em **inglês** (`Service`, `Controller`, `Gateway`, e nomes de componentes React como `Home`, `BookCard`). Mantenha essa mistura — não traduza um lado pro outro.

## Backend

**Um sufixo de arquivo por camada:**

| Camada | Padrão | Exemplo |
|---|---|---|
| routes | `<recurso>.routes.js` | `vendas.routes.js` |
| controllers | `<recurso>.controller.js` | `livros.controller.js` |
| services | `<recurso>.service.js` | `autores.service.js` |
| gateways | `<nome>.gateway.js` | `email.gateway.js` |
| config | `<nome>.config.js` | `database.config.js` |
| models | nome da entidade, sem sufixo | `livro.js`, `venda.js` |
| erros | PascalCase = nome da classe | `NaoEncontrado.js` |
| middlewares | camelCase = nome da função | `paginar.js` |
| domain | kebab-case | `venda-calculadora.js` |
| testes | `<algo>.unit-spec.js` / `.integration-spec.js` / `.e2e-spec.js` | `venda-calculadora.unit-spec.js` |

**Imports**: use os aliases nativos do `package.json` (`#controllers/`, `#services/`, `#db/`, `#domain/`, `#gateways/`, `#erros/`, `#middlewares/`, `#utils/`, `#models/`, `#routes/`, `#test/`) em vez de caminhos relativos longos (`../../../`).

**Erros**: lance subclasses de `ErroBase` (`RequisicaoIncorreta` 400, `NaoEncontrado` 404, `Conflito` 409) em vez de `throw new Error(...)` genérico ou `res.status().json()` manual no controller. O middleware final já traduz os principais códigos de erro do Postgres — não capture e reformate isso manualmente em cada controller.

**Validação**: use `validarObrigatorios`/`validarNumeroPositivo` (`src/utils/validarCampos.js`) para validação simples de entrada no controller. Não introduza uma lib de schema (Zod/Joi) sem necessidade real — ver ADR-003 em `arquitetura.md`.

**Paginação**: rotas de listagem devem montar o query builder no controller (`req.consultaPaginavel = service.consultarX()`) e delegar a paginação/ordenação ao middleware `paginar({ colunasPermitidas: [...] })` — não pagine manualmente dentro do controller.

**Repositório**: novos models estendem `RepositorioBase`, declarando `tabela` e `camposInseriveis`. Campos opcionais no construtor devem ter um default explícito (`= null`, `= 0`) — nunca deixe `undefined` chegar no `insert()` do Knex (gera erro de binding).

## Frontend

- Só function components, exportados nomeados (`export function X`) — nunca `export default`, exceto `App.jsx`.
- Páginas (`pages/*`) que buscam dado seguem o padrão de 3 estados: `carregando`/`erro`/dado, resolvidos manualmente em `useEffect` com `.then/.catch/.finally`. Não introduza React Query/SWR sem necessidade real.
- Componentes (`components/*`) são apresentacionais — recebem dado via props, não fazem fetch próprio (exceção: os que consomem `useCart()`).
- Formulários são controlados manualmente (`useState` por campo) — sem Formik/React Hook Form.
- Estilo vive em `src/styles.css`, um único arquivo global com custom properties como tokens (`--cor-*`, `--raio`, `--sombra`). Não introduza Tailwind/CSS Modules/styled-components sem necessidade real.

## Testes — backend

Pirâmide real em `test/`:

- `test/unit` — lógica pura, sem I/O, sem HTTP.
- `test/integration` — camadas se comunicando: model+banco real, controller+service mockado, service+banco real+gateways mockados.
- `test/e2e` — HTTP real via Supertest, contra `criarAppDeTeste()` (gateways mockados por padrão).
- `test/support` — factories (`fabricas.js`), mocks de `res` (`mock-response.js`), helpers de assert sobre `mock.fn()`.

Toda suíte de integration/e2e trunca as tabelas em `beforeEach` (`TRUNCATE ... RESTART IDENTITY CASCADE`) e roda com `--test-concurrency=1`, porque compartilha a mesma conexão/banco `test`. Não remova essa flag sem isolar as suítes de outra forma.

## Testes — frontend (a partir de 2026-09-06)

Ver ADR-005. Toda função/componente novo do frontend passa a exigir teste automatizado com **Vitest + @testing-library/react**:

- Funções puras (ex: `formatarPreco`, lógica de desconto) → teste de unidade direto.
- Componentes (`BookCard`, `CartContext`, páginas) → teste de componente com `render()` + queries de `@testing-library/react`, simulando interação do usuário (`userEvent`), não detalhe de implementação.
- Esses testes rodam localmente/CI como rede de segurança contra regressão — **não substituem** a prova de QA real via `claude-in-chrome` (ver `ambiente.md`). Um item de test-plan só é marcado como concluído com prova de navegador real, nunca só com teste automatizado passando.

Setup ainda não existe no repo — a primeira tarefa que tocar frontend deve instalar `vitest`, `@testing-library/react`, `@testing-library/user-event` e `jsdom` como dev dependencies e configurar `vite.config.js`/`package.json` (`"test": "vitest run"`).
