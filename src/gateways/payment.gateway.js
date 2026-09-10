const QUANTIDADE_GATILHO_RECUSA = 13;

export class PaymentGateway {
  constructor(stockGateway) {
    this.stockGateway = stockGateway;
  }

  async processarPagamento(conexao, { livroId, quantidade }) {
    if (quantidade === QUANTIDADE_GATILHO_RECUSA) {
      return { aprovado: false, motivo: 'pagamento recusado' };
    }

    const decrementou = await this.stockGateway.decrementarEstoque(conexao, livroId, quantidade);
    if (!decrementou) {
      return { aprovado: false, motivo: 'sem estoque no momento da confirmação' };
    }

    return { aprovado: true, motivo: null };
  }
}
