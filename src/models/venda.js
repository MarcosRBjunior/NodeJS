import { RepositorioBase } from './RepositorioBase.js';

export default class Venda extends RepositorioBase {
  static tabela = 'vendas';
  static camposInseriveis = ['livro_id', 'valor', 'tipo_pagamento', 'cliente_id', 'quantidade', 'status', 'motivo_recusa'];

  constructor({ id, livro_id, valor, tipo_pagamento, cliente_id = null, quantidade = 1, status = 'pendente', motivo_recusa = null } = {}) {
    super();
    this.id = id;
    this.livro_id = livro_id;
    this.valor = valor;
    this.tipo_pagamento = tipo_pagamento;
    this.cliente_id = cliente_id;
    this.quantidade = quantidade;
    this.status = status;
    this.motivo_recusa = motivo_recusa;
  }
}
