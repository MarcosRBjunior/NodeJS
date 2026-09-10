import Venda from '#models/venda.js';
import Livro from '#models/livro.js';
import Editora from '#models/editora.js';
import { VendaCalculadora } from '#domain/venda-calculadora.js';
import { NaoEncontrado } from '#erros/NaoEncontrado.js';
import { Conflito } from '#erros/Conflito.js';
import { Proibido } from '#erros/Proibido.js';
import { RequisicaoIncorreta } from '#erros/RequisicaoIncorreta.js';

export class VendasService {
  constructor(databaseConnection, emailGateway, paymentGateway) {
    Venda.configurarDB(databaseConnection);
    Livro.configurarDB(databaseConnection);
    Editora.configurarDB(databaseConnection);
    this.db = databaseConnection;
    this.emailGateway = emailGateway;
    this.paymentGateway = paymentGateway;
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
    if (livro.estoque_quantidade < quantidade) throw new Conflito('livro sem estoque disponível');

    let valorFinal;
    try {
      valorFinal = VendaCalculadora.calcularValorFinal(valor, modoPagamento);
    } catch (erro) {
      throw new RequisicaoIncorreta(erro.message);
    }

    const venda = new Venda({ livro_id: idLivro, valor: valorFinal, tipo_pagamento: modoPagamento, cliente_id: clienteId, quantidade });
    return venda.salvar();
  }

  async confirmarPagamento(vendaId, clienteId) {
    const venda = await Venda.pegarPeloId(vendaId);
    if (!venda) throw new NaoEncontrado('Venda não encontrada');
    if (venda.cliente_id !== clienteId) throw new Proibido('Você não tem permissão para confirmar esta venda.');
    if (venda.status !== 'pendente') throw new Conflito('Pagamento já processado para esta venda.');

    const resultado = await this.db.transaction(async (trx) => {
      const decisao = await this.paymentGateway.processarPagamento(trx, { livroId: venda.livro_id, quantidade: venda.quantidade });
      const status = decisao.aprovado ? 'aprovado' : 'recusado';
      await Venda.atualizarPeloId(venda.id, { status, motivo_recusa: decisao.motivo }, trx);
      return decisao;
    });

    const vendaAtualizada = await Venda.pegarPeloId(vendaId);

    if (resultado.aprovado) {
      const livro = await Livro.pegarPeloId(venda.livro_id);
      const editora = await Editora.pegarPeloId(livro.editora_id);
      await this.emailGateway.enviar({
        para: editora.email,
        assunto: 'Nova venda registrada',
        corpo: `O livro "${livro.titulo}" foi vendido por ${venda.valor}.`,
      });
    }

    return vendaAtualizada;
  }
}
