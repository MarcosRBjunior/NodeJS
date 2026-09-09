import { describe, it, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert';
import { obterConexao } from '#db/connection.js';
import { VendasService } from '#services/vendas.service.js';
import { StockGateway } from '#gateways/stock.gateway.js';
import { criarLivro } from '#test/support/fabricas.js';

const db = obterConexao();

describe('VendasService (integração — banco real, incluindo estoque)', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE vendas, livros, autores, editoras RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  it('deve registrar uma venda aplicando o desconto e notificar a editora por email', async () => {
    const livro = await criarLivro(db);
    const emailGateway = { enviar: mock.fn(async () => {}) };
    const vendasService = new VendasService(db, emailGateway, new StockGateway());

    const venda = await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

    assert.ok(venda.id);
    assert.strictEqual(Number(venda.valor), 92);
    assert.strictEqual(emailGateway.enviar.mock.callCount(), 1);
  });

  it('deve decrementar o estoque do livro pela quantidade comprada', async () => {
    const livro = await criarLivro(db, { estoque_quantidade: 5 });
    const vendasService = new VendasService(db, { enviar: mock.fn() }, new StockGateway());

    await vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 2 });

    const livroAtualizado = await db('livros').where({ id: livro.id }).first();
    assert.strictEqual(livroAtualizado.estoque_quantidade, 3);
  });

  it('deve lançar Conflito (409) quando o estoque é insuficiente, sem alterar estoque nem criar a venda', async () => {
    const livro = await criarLivro(db, { estoque_quantidade: 1 });
    const vendasService = new VendasService(db, { enviar: mock.fn() }, new StockGateway());

    await assert.rejects(
      vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 2 }),
      (erro) => erro.status === 409 && /sem estoque/.test(erro.message),
    );

    const livroAtualizado = await db('livros').where({ id: livro.id }).first();
    assert.strictEqual(livroAtualizado.estoque_quantidade, 1);
    const vendas = await db('vendas').where({ livro_id: livro.id });
    assert.strictEqual(vendas.length, 0);
  });

  it('deve permitir só uma venda quando duas compras concorrem pelo último item em estoque', async () => {
    const livro = await criarLivro(db, { estoque_quantidade: 1 });
    const vendasService = new VendasService(db, { enviar: mock.fn(async () => {}) }, new StockGateway());

    const resultados = await Promise.allSettled([
      vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 }),
      vendasService.registrarVenda({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 }),
    ]);

    const sucesso = resultados.filter((r) => r.status === 'fulfilled');
    const falha = resultados.filter((r) => r.status === 'rejected');
    assert.strictEqual(sucesso.length, 1);
    assert.strictEqual(falha.length, 1);
    assert.strictEqual(falha[0].reason.status, 409);

    const livroAtualizado = await db('livros').where({ id: livro.id }).first();
    assert.strictEqual(livroAtualizado.estoque_quantidade, 0);
  });

  it('deve lançar NaoEncontrado (404) quando o livro não existe', async () => {
    const vendasService = new VendasService(db, { enviar: mock.fn() }, new StockGateway());

    await assert.rejects(
      vendasService.registrarVenda({ idLivro: 9999, valor: 100, modoPagamento: 'PIX', quantidade: 1 }),
      (erro) => erro.status === 404 && /Livro não encontrado/.test(erro.message),
    );
  });
});
