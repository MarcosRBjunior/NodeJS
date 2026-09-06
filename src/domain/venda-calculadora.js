const DESCONTOS_POR_MODO_PAGAMENTO = {
  DINHEIRO: 0.1,
  PIX: 0.08,
  BOLETO: 0.05,
  CARTAO_DEBITO: 0.03,
  CARTAO_CREDITO: 0,
};

export class VendaCalculadora {
  static calcularValorFinal(valor, modoPagamento) {
    const desconto = DESCONTOS_POR_MODO_PAGAMENTO[modoPagamento];
    if (desconto === undefined) {
      throw new Error(`Modo de pagamento inválido: ${modoPagamento}`);
    }
    // Converte para centavos antes de aplicar o desconto e arredonda uma única vez,
    // no final: evita que o erro de ponto flutuante de "valor - valor * desconto"
    // derrube o centavo para baixo (ex.: 2.05 com 10% deveria dar 1.85, não 1.84).
    const centavos = Math.round(valor * 100);
    return Math.round(centavos * (1 - desconto)) / 100;
  }
}
