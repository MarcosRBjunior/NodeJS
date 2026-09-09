import Venda from '#models/venda.js';
import Livro from '#models/livro.js';
import Editora from '#models/editora.js';
import { VendaCalculadora } from '#domain/venda-calculadora.js';
import { NaoEncontrado } from '#erros/NaoEncontrado.js';
import { Conflito } from '#erros/Conflito.js';
import { RequisicaoIncorreta } from '#erros/RequisicaoIncorreta.js';

export class VendasService {
  constructor(databaseConnection, emailGateway, stockGateway) {
    Venda.configurarDB(databaseConnection);
    Livro.configurarDB(databaseConnection);
    Editora.configurarDB(databaseConnection);
    this.db = databaseConnection;
    this.emailGateway = emailGateway;
    this.stockGateway = stockGateway;
  }

  async listarVendas() {
    return Venda.pegarTodos();
  }

  consultarVendas() {
    return Venda.query();
  }

  async buscarVendaPorId(id) {
    return Venda.pegarPeloId(id);
  }

  async registrarVenda({ idLivro, valor, modoPagamento, quantidade, clienteId }) {
    const livro = await Livro.pegarPeloId(idLivro);
    if (!livro) throw new NaoEncontrado('Livro não encontrado');

    let valorFinal;
    try {
      valorFinal = VendaCalculadora.calcularValorFinal(valor, modoPagamento);
    } catch (erro) {
      throw new RequisicaoIncorreta(erro.message);
    }

    const vendaCriada = await this.db.transaction(async (trx) => {
      const temEstoque = await this.stockGateway.decrementarEstoque(trx, idLivro, quantidade);
      if (!temEstoque) throw new Conflito('livro sem estoque disponível');

      const venda = new Venda({ livro_id: idLivro, valor: valorFinal, tipo_pagamento: modoPagamento, cliente_id: clienteId, quantidade });
      return venda.salvar(trx);
    });

    const editora = await Editora.pegarPeloId(livro.editora_id);
    await this.emailGateway.enviar({
      para: editora.email,
      assunto: 'Nova venda registrada',
      corpo: `O livro "${livro.titulo}" foi vendido por ${valorFinal}.`,
    });

    return vendaCriada;
  }
}
