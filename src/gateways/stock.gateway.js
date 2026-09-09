export class StockGateway {
  async decrementarEstoque(conexao, livroId, quantidade) {
    const linhasAfetadas = await conexao('livros')
      .where({ id: livroId })
      .andWhere('estoque_quantidade', '>=', quantidade)
      .decrement('estoque_quantidade', quantidade);

    return linhasAfetadas > 0;
  }
}
