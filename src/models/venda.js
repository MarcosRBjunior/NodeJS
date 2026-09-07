import { RepositorioBase } from './RepositorioBase.js';

export default class Venda extends RepositorioBase {
  static tabela = 'vendas';
  static camposInseriveis = ['livro_id', 'valor', 'tipo_pagamento', 'cliente_id'];

  constructor({ id, livro_id, valor, tipo_pagamento, cliente_id = null } = {}) {
    super();
    this.id = id;
    this.livro_id = livro_id;
    this.valor = valor;
    this.tipo_pagamento = tipo_pagamento;
    this.cliente_id = cliente_id;
  }
}
