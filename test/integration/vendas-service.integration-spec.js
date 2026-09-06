import { describe, it, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert';
import { obterConexao } from '#db/connection.js';
import { VendasService } from '#services/vendas.service.js';
import { criarLivro } from '#test/support/fabricas.js';

const db = obterConexao();

describe('VendasService (integração — banco real + gateways mockados)', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE vendas, livros, autores, editoras RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  it('deve registrar uma venda aplicando o desconto e notificar a editora por email', async () => {
    const livro = await criarLivro(db);
    const emailGateway = { enviar: mock.fn(async () => {}) };
    const stockGateway = { consultarEstoque: mock.fn(async () => true) };
    const vendasService = new VendasService(db, emailGateway, stockGateway);

    const venda = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX' });

    assert.ok(venda.id);
    assert.strictEqual(Number(venda.valor), 92);
    assert.strictEqual(emailGateway.enviar.mock.callCount(), 1);
  });

  it('deve lançar Conflito (409) quando o livro está sem estoque disponível', async () => {
    const livro = await criarLivro(db);
    const stockGateway = { consultarEstoque: mock.fn(async () => false) };
    const vendasService = new VendasService(db, { enviar: mock.fn() }, stockGateway);

    await assert.rejects(
      vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX' }),
      erro => erro.status === 409 && /sem estoque/.test(erro.message),
    );
  });

  it('deve lançar NaoEncontrado (404) quando o livro não existe', async () => {
    const vendasService = new VendasService(db, { enviar: mock.fn() }, { consultarEstoque: mock.fn(async () => true) });

    await assert.rejects(
      vendasService.registrarVenda({ idLivro: 9999, valor: 100, modoPagamento: 'PIX' }),
      erro => erro.status === 404 && /Livro não encontrado/.test(erro.message),
    );
  });
});
