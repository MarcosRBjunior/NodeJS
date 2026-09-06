import { describe, it } from 'node:test';
import assert from 'node:assert';
import { VendaCalculadora } from '#domain/venda-calculadora.js';

describe('VendaCalculadora (unitário)', () => {
  const casos = [
    { modoPagamento: 'DINHEIRO', valor: 100, esperado: 90 },
    { modoPagamento: 'PIX', valor: 100, esperado: 92 },
    { modoPagamento: 'BOLETO', valor: 100, esperado: 95 },
    { modoPagamento: 'CARTAO_DEBITO', valor: 100, esperado: 97 },
    { modoPagamento: 'CARTAO_CREDITO', valor: 100, esperado: 100 },
  ];

  for (const { modoPagamento, valor, esperado } of casos) {
    it(`deve calcular o valor final para pagamento em ${modoPagamento}`, () => {
      assert.strictEqual(VendaCalculadora.calcularValorFinal(valor, modoPagamento), esperado);
    });
  }

  it('deve lançar erro para modo de pagamento desconhecido', () => {
    assert.throws(() => VendaCalculadora.calcularValorFinal(100, 'CRIPTOMOEDA'), /Modo de pagamento inválido/);
  });

  it('não deve perder um centavo por imprecisão de ponto flutuante', () => {
    // 2.05 - 2.05*0.1 = 1.845 em decimal exato; em ponto flutuante binário vira
    // 1.8449999999999998, que arredondado ingenuamente cai para 1.84 em vez de 1.85.
    assert.strictEqual(VendaCalculadora.calcularValorFinal(2.05, 'DINHEIRO'), 1.85);
  });
});
