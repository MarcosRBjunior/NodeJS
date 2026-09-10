import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { PaymentGateway } from '#gateways/payment.gateway.js';

describe('PaymentGateway (unidade)', () => {
  it('deve recusar sempre que a quantidade for exatamente 13, sem tentar decrementar estoque', async () => {
    const stockGateway = { decrementarEstoque: mock.fn(async () => true) };
    const paymentGateway = new PaymentGateway(stockGateway);

    const resultado = await paymentGateway.processarPagamento({}, { livroId: 1, quantidade: 13 });

    assert.strictEqual(resultado.aprovado, false);
    assert.strictEqual(resultado.motivo, 'pagamento recusado');
    assert.strictEqual(stockGateway.decrementarEstoque.mock.callCount(), 0);
  });

  it('deve aprovar qualquer outra quantidade quando o estoque é suficiente', async () => {
    const stockGateway = { decrementarEstoque: mock.fn(async () => true) };
    const paymentGateway = new PaymentGateway(stockGateway);

    const resultado = await paymentGateway.processarPagamento({}, { livroId: 1, quantidade: 5 });

    assert.strictEqual(resultado.aprovado, true);
    assert.strictEqual(resultado.motivo, null);
    assert.strictEqual(stockGateway.decrementarEstoque.mock.callCount(), 1);
  });

  it('deve recusar por falta de estoque quando o decremento atômico não afeta nenhuma linha', async () => {
    const stockGateway = { decrementarEstoque: mock.fn(async () => false) };
    const paymentGateway = new PaymentGateway(stockGateway);

    const resultado = await paymentGateway.processarPagamento({}, { livroId: 1, quantidade: 5 });

    assert.strictEqual(resultado.aprovado, false);
    assert.strictEqual(resultado.motivo, 'sem estoque no momento da confirmação');
  });
});
