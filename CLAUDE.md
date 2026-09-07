# bordeless — Library Fast

API REST de livraria (Node/Express/Knex/Postgres) + frontend React/Vite para a loja **Library Fast** (livros de tecnologia e idiomas). Projeto de faculdade que também serve como peça de portfólio — critério de "pronto" prioriza rigor de engenharia demonstrável, não hardening de produção real.

## Documentação

- [Arquitetura](docs/projeto/arquitetura.md) — o que é, pra quem, camadas, decisões técnicas (ADRs)
- [Convenções](docs/projeto/convencoes.md) — padrões de código, nomenclatura, convenção de teste
- [Ambiente](docs/projeto/ambiente.md) — comandos testados de instalar, rodar, testar e buildar
- [PRDs por tarefa](docs/prd/README.md) — requisitos e test plan de cada feature/fix
- [Aprendizados](docs/aprendizados/README.md) — registrado ao fechar cada sessão de trabalho

## Regras do processo

Válidas a partir de 2026-09-06. Se alguma regra abaixo conflitar com uma instrução pontual do usuário na conversa, a instrução pontual vale — mas avise que está desviando da regra.

### 1. Toda feature nova ou bug fix começa pelos requisitos

Antes de escrever qualquer código: criar `docs/prd/<nome-da-tarefa>/requirements.md` (copiando `docs/prd/_template/requirements.md`), quebrando cada requisito num checkbox verificável. Mesmo que o pedido já venha com requisitos claros do usuário, registrar mesmo assim — não pular a etapa por parecer óbvio.

### 2. Test Plan é obrigatório e escrito junto, antes de codar

Junto com o `requirements.md`, escrever `docs/prd/<nome-da-tarefa>/test-plan.md` (copiando `docs/prd/_template/test-plan.md`), também em checkboxes, um por caso de teste verificável.

### 3. QA é sempre um agente separado — nunca quem escreveu o código

Terminada **cada item** do requirements.md, subir um agente de QA via Agent tool (subagent_type **diferente de `fork`** — precisa ser um agente sem memória desta conversa nem do código que foi escrito) passando só: o `test-plan.md` da tarefa e como acessar o app rodando (URL, portas). O agente de QA testa e decide se cada item passa.

Quem escreve o código (esta sessão) **nunca marca um checkbox do test-plan.md**. Só o QA marca — e só depois de validar com prova real (regra 4).

### 4. O que conta como prova real

- **Para features web**: usar `claude-in-chrome` (ver ADR-006 em `docs/projeto/arquitetura.md`) — abrir a página de verdade, clicar, digitar, conferir screenshot, conferir request de rede real, conferir console.
- **Não conta como prova**: chamada isolada via CLI/curl sem passar pela UI quando a regra pedir teste de UI, script mockado, ou inferência sem executar nada.
- Se a ferramenta de navegador falhar: repassar ao usuário o comando exato que falhou, avisar que a sessão pode precisar ser reiniciada, e retomar a validação depois — nunca marcar o checkbox sem a prova real ter rodado.

### 5. Fechar sessão

Quando o usuário disser **"fecha a sessão"**: escrever os aprendizados da sessão em `docs/aprendizados/<data>-<tema>.md` e **mostrar o conteúdo pro usuário antes de salvar o arquivo**.
