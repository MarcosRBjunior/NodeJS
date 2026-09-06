export class StockGateway {
  async consultarEstoque(livroId) {
    console.log(`[Estoque API] Consultando estoque do livro ${livroId}...`);
    return true;
  }
}
