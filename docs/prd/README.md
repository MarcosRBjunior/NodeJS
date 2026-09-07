# PRDs por tarefa

A partir de 2026-09-06 (ver `CLAUDE.md`, seção "Regras do processo"), toda funcionalidade nova ou bug fix começa por aqui, **antes** de qualquer código ser escrito.

## Convenção

Cada tarefa ganha uma pasta própria: `docs/prd/<nome-da-tarefa>/`, contendo:

- `requirements.md` — o que precisa ser feito, quebrado em checkboxes.
- `test-plan.md` — como isso vai ser provado, item a item, também em checkboxes.

Use `docs/prd/_template/` como ponto de partida (copie os dois arquivos pra pasta da nova tarefa e preencha).

`<nome-da-tarefa>` é kebab-case e descreve a feature, não a data nem o autor (ex: `autenticacao-cliente`, `frontend-testes-vitest`, `pagamento-real`).

## Regra de checkbox

- Quem escreve o código (dev/Claude) **nunca** marca um checkbox do `test-plan.md` como concluído.
- Todo checkbox do `test-plan.md` só é marcado depois de um agente de QA separado — sem conhecimento prévio do código — validar aquele item com prova real (ver `docs/projeto/ambiente.md`, seção "Prova de QA").
- Checkboxes do `requirements.md` podem ser marcados pelo dev conforme implementa, mas o item só é considerado "pronto de verdade" quando o teste correspondente no `test-plan.md` também está marcado.
