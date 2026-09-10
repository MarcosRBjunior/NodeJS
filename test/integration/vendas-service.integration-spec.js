import { describe, it, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert';
import { obterConexao } from '#db/connection.js';
import { VendasService } from '#services/vendas.service.js';
import { PaymentGateway } from '#gateways/payment.gateway.js';
import { StockGateway } from '#gateways/stock.gateway.js';
import { criarLivro, criarCliente } from '#test/support/fabricas.js';

const db = obterConexao();

function criarVendasService(overrides = {}) {
  const emailGateway = overrides.emailGateway ?? { enviar: mock.fn(async () => {}) };
  const paymentGateway = overrides.paymentGateway ?? new PaymentGateway(new StockGateway());
  return new VendasService(db, emailGateway, paymentGateway);
}

describe('VendasService (integração — banco real)', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE vendas, livros, autores, editoras, clientes RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  describe('registrarVenda', () => {
    it('deve criar a venda como pendente, aplicando o desconto, sem decrementar estoque nem notificar a editora', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 5 });
      const cliente = await criarCliente(db);
      const emailGateway = { enviar: mock.fn(async () => {}) };
      const vendasService = criarVendasService({ emailGateway });

      const venda = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1, clienteId: cliente.id });

      assert.ok(venda.id);
      assert.strictEqual(venda.status, 'pendente');
      assert.strictEqual(Number(venda.valor), 92);
      assert.strictEqual(emailGateway.enviar.mock.callCount(), 0);

      const livroAtualizado = await db('livros').where({ id: livro.id }).first();
      assert.strictEqual(livroAtualizado.estoque_quantidade, 5);
    });

    it('deve lançar Conflito (409) quando o estoque já é claramente insuficiente (checagem branda), sem criar a venda', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 1 });
      const cliente = await criarCliente(db);
      const vendasService = criarVendasService();

      await assert.rejects(
        vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 2, clienteId: cliente.id }),
        (erro) => erro.status === 409 && /sem estoque/.test(erro.message),
      );

      const vendas = await db('vendas').where({ livro_id: livro.id });
      assert.strictEqual(vendas.length, 0);
    });

    it('deve lançar NaoEncontrado (404) quando o livro não existe', async () => {
      const cliente = await criarCliente(db);
      const vendasService = criarVendasService();

      await assert.rejects(
        vendasService.registrarVenda({ idLivro: 9999, valor: 100, modoPagamento: 'PIX', quantidade: 1, clienteId: cliente.id }),
        (erro) => erro.status === 404 && /Livro não encontrado/.test(erro.message),
      );
    });
  });

  describe('confirmarPagamento', () => {
    it('deve aprovar, decrementar o estoque pela quantidade da venda e notificar a editora', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 5 });
      const cliente = await criarCliente(db);
      const emailGateway = { enviar: mock.fn(async () => {}) };
      const vendasService = criarVendasService({ emailGateway });
      const venda = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 2, clienteId: cliente.id });

      const vendaConfirmada = await vendasService.confirmarPagamento(venda.id, cliente.id);

      assert.strictEqual(vendaConfirmada.status, 'aprovado');
      assert.strictEqual(vendaConfirmada.motivo_recusa, null);
      assert.strictEqual(emailGateway.enviar.mock.callCount(), 1);

      const livroAtualizado = await db('livros').where({ id: livro.id }).first();
      assert.strictEqual(livroAtualizado.estoque_quantidade, 3);
    });

    it('deve recusar pelo gatilho determinístico (quantidade === 13), sem decrementar estoque nem notificar a editora', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 20 });
      const cliente = await criarCliente(db);
      const emailGateway = { enviar: mock.fn(async () => {}) };
      const vendasService = criarVendasService({ emailGateway });
      const venda = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 13, clienteId: cliente.id });

      const vendaConfirmada = await vendasService.confirmarPagamento(venda.id, cliente.id);

      assert.strictEqual(vendaConfirmada.status, 'recusado');
      assert.strictEqual(vendaConfirmada.motivo_recusa, 'pagamento recusado');
      assert.strictEqual(emailGateway.enviar.mock.callCount(), 0);

      const livroAtualizado = await db('livros').where({ id: livro.id }).first();
      assert.strictEqual(livroAtualizado.estoque_quantidade, 20);
    });

    it('deve recusar por falta de estoque no momento da confirmação quando o estoque foi consumido por outra venda enquanto esta estava pendente', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 1 });
      const cliente = await criarCliente(db);
      const vendasService = criarVendasService();

      const vendaA = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1, clienteId: cliente.id });
      const vendaB = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1, clienteId: cliente.id });

      const confirmacaoA = await vendasService.confirmarPagamento(vendaA.id, cliente.id);
      assert.strictEqual(confirmacaoA.status, 'aprovado');

      const confirmacaoB = await vendasService.confirmarPagamento(vendaB.id, cliente.id);
      assert.strictEqual(confirmacaoB.status, 'recusado');
      assert.strictEqual(confirmacaoB.motivo_recusa, 'sem estoque no momento da confirmação');

      const livroAtualizado = await db('livros').where({ id: livro.id }).first();
      assert.strictEqual(livroAtualizado.estoque_quantidade, 0);
    });

    it('deve permitir só uma aprovação quando duas confirmações concorrem pelo último item em estoque', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 1 });
      const cliente = await criarCliente(db);
      const vendasService = criarVendasService();

      const vendaA = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1, clienteId: cliente.id });
      const vendaB = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1, clienteId: cliente.id });

      const resultados = await Promise.all([
        vendasService.confirmarPagamento(vendaA.id, cliente.id),
        vendasService.confirmarPagamento(vendaB.id, cliente.id),
      ]);

      const aprovadas = resultados.filter((r) => r.status === 'aprovado');
      const recusadas = resultados.filter((r) => r.status === 'recusado');
      assert.strictEqual(aprovadas.length, 1);
      assert.strictEqual(recusadas.length, 1);

      const livroAtualizado = await db('livros').where({ id: livro.id }).first();
      assert.strictEqual(livroAtualizado.estoque_quantidade, 0);
    });

    it('deve lançar Proibido (403) ao confirmar uma venda que não pertence ao cliente autenticado, sem alterar a venda', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 5 });
      const clienteDono = await criarCliente(db);
      const outroCliente = await criarCliente(db);
      const vendasService = criarVendasService();
      const venda = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1, clienteId: clienteDono.id });

      await assert.rejects(
        vendasService.confirmarPagamento(venda.id, outroCliente.id),
        (erro) => erro.status === 403,
      );

      const vendaNoBanco = await db('vendas').where({ id: venda.id }).first();
      assert.strictEqual(vendaNoBanco.status, 'pendente');
    });

    it('deve lançar Conflito (409) ao confirmar uma venda que não está mais pendente, sem reprocessar', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 5 });
      const cliente = await criarCliente(db);
      const vendasService = criarVendasService();
      const venda = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1, clienteId: cliente.id });
      await vendasService.confirmarPagamento(venda.id, cliente.id);

      await assert.rejects(
        vendasService.confirmarPagamento(venda.id, cliente.id),
        (erro) => erro.status === 409,
      );

      const livroAtualizado = await db('livros').where({ id: livro.id }).first();
      assert.strictEqual(livroAtualizado.estoque_quantidade, 4);
    });

    it('deve lançar NaoEncontrado (404) ao confirmar uma venda inexistente', async () => {
      const cliente = await criarCliente(db);
      const vendasService = criarVendasService();

      await assert.rejects(
        vendasService.confirmarPagamento(9999, cliente.id),
        (erro) => erro.status === 404,
      );
    });
  });
});
