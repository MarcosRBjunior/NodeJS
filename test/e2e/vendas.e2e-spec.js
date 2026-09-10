import { describe, it, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { obterConexao } from '#db/connection.js';
import { criarAppDeTeste } from '#test/support/app-teste.js';
import { criarLivro, criarCliente, tokenPara } from '#test/support/fabricas.js';

const db = obterConexao();

describe('Vendas E2E', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE vendas, livros, autores, editoras, clientes RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  it('deve registrar uma venda pendente com dados válidos, associá-la ao cliente autenticado e não notificar a editora ainda', async () => {
    const livro = await criarLivro(db);
    const cliente = await criarCliente(db);
    const emailGateway = { enviar: mock.fn(async () => {}) };
    const app = criarAppDeTeste({ emailGateway });

    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

    assert.strictEqual(resposta.status, 201);
    assert.strictEqual(resposta.body.cliente_id, cliente.id);
    assert.strictEqual(resposta.body.quantidade, 1);
    assert.strictEqual(resposta.body.status, 'pendente');
    assert.strictEqual(emailGateway.enviar.mock.callCount(), 0);
  });

  it('deve retornar 401 ao registrar venda sem autenticação', async () => {
    const livro = await criarLivro(db);
    const app = criarAppDeTeste();

    const resposta = await request(app).post('/vendas').send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

    assert.strictEqual(resposta.status, 401);
  });

  it('deve retornar 400 ao registrar venda com dados inválidos', async () => {
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();

    const resposta = await request(app).post('/vendas').set('Authorization', `Bearer ${tokenPara(cliente)}`).send({});

    assert.strictEqual(resposta.status, 400);
  });

  it('deve retornar 400 ao registrar venda com valor não numérico', async () => {
    const livro = await criarLivro(db);
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();

    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 'abc', modoPagamento: 'PIX', quantidade: 1 });

    assert.strictEqual(resposta.status, 400);
  });

  it('deve retornar 400 ao registrar venda com quantidade não inteira', async () => {
    const livro = await criarLivro(db);
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();

    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1.5 });

    assert.strictEqual(resposta.status, 400);
  });

  it('deve retornar 400 (não 500) ao registrar venda com quantidade acima do limite do Postgres', async () => {
    const livro = await criarLivro(db);
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();

    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 99999999999 });

    assert.strictEqual(resposta.status, 400);
  });

  it('deve retornar 404 ao registrar venda para um livro inexistente', async () => {
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();

    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: 999999, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

    assert.strictEqual(resposta.status, 404);
  });

  it('deve retornar 409 ao registrar venda de um livro sem estoque disponível (checagem branda)', async () => {
    const livro = await criarLivro(db, { estoque_quantidade: 0 });
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();

    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

    assert.strictEqual(resposta.status, 409);
  });

  it('deve retornar 409 ao pedir mais unidades do que o estoque disponível (checagem branda)', async () => {
    const livro = await criarLivro(db, { estoque_quantidade: 2 });
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();

    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 3 });

    assert.strictEqual(resposta.status, 409);

    const livroAtualizado = await db('livros').where({ id: livro.id }).first();
    assert.strictEqual(livroAtualizado.estoque_quantidade, 2);
  });

  it('deve listar as vendas registradas', async () => {
    const livro = await criarLivro(db);
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();
    await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

    const resposta = await request(app).get('/vendas');

    assert.strictEqual(resposta.status, 200);
    assert.strictEqual(resposta.body.length, 1);
  });

  describe('POST /vendas/:id/confirmar-pagamento', () => {
    it('deve aprovar o pagamento, decrementar o estoque e refletir o status em GET /vendas/:id', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 5 });
      const cliente = await criarCliente(db);
      const emailGateway = { enviar: mock.fn(async () => {}) };
      const app = criarAppDeTeste({ emailGateway });

      const criacao = await request(app)
        .post('/vendas')
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 2 });

      const confirmacao = await request(app)
        .post(`/vendas/${criacao.body.id}/confirmar-pagamento`)
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send();

      assert.strictEqual(confirmacao.status, 200);
      assert.strictEqual(confirmacao.body.status, 'aprovado');
      assert.strictEqual(emailGateway.enviar.mock.callCount(), 1);

      const livroAtualizado = await db('livros').where({ id: livro.id }).first();
      assert.strictEqual(livroAtualizado.estoque_quantidade, 3);

      const consulta = await request(app).get(`/vendas/${criacao.body.id}`);
      assert.strictEqual(consulta.body.status, 'aprovado');
    });

    it('deve recusar o pagamento pelo gatilho determinístico (quantidade === 13) sem alterar o estoque', async () => {
      const livro = await criarLivro(db, { estoque_quantidade: 20 });
      const cliente = await criarCliente(db);
      const app = criarAppDeTeste();

      const criacao = await request(app)
        .post('/vendas')
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 13 });

      const confirmacao = await request(app)
        .post(`/vendas/${criacao.body.id}/confirmar-pagamento`)
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send();

      assert.strictEqual(confirmacao.status, 200);
      assert.strictEqual(confirmacao.body.status, 'recusado');
      assert.strictEqual(confirmacao.body.motivo_recusa, 'pagamento recusado');

      const livroAtualizado = await db('livros').where({ id: livro.id }).first();
      assert.strictEqual(livroAtualizado.estoque_quantidade, 20);
    });

    it('deve retornar 401 ao confirmar pagamento sem autenticação', async () => {
      const livro = await criarLivro(db);
      const cliente = await criarCliente(db);
      const app = criarAppDeTeste();
      const criacao = await request(app)
        .post('/vendas')
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

      const resposta = await request(app).post(`/vendas/${criacao.body.id}/confirmar-pagamento`).send();

      assert.strictEqual(resposta.status, 401);
    });

    it('deve retornar 403 ao confirmar pagamento de uma venda que não pertence ao cliente autenticado', async () => {
      const livro = await criarLivro(db);
      const clienteDono = await criarCliente(db);
      const outroCliente = await criarCliente(db);
      const app = criarAppDeTeste();
      const criacao = await request(app)
        .post('/vendas')
        .set('Authorization', `Bearer ${tokenPara(clienteDono)}`)
        .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

      const resposta = await request(app)
        .post(`/vendas/${criacao.body.id}/confirmar-pagamento`)
        .set('Authorization', `Bearer ${tokenPara(outroCliente)}`)
        .send();

      assert.strictEqual(resposta.status, 403);

      const vendaNoBanco = await db('vendas').where({ id: criacao.body.id }).first();
      assert.strictEqual(vendaNoBanco.status, 'pendente');
    });

    it('deve retornar 409 ao confirmar pagamento de uma venda que não está mais pendente', async () => {
      const livro = await criarLivro(db);
      const cliente = await criarCliente(db);
      const app = criarAppDeTeste();
      const criacao = await request(app)
        .post('/vendas')
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });
      await request(app)
        .post(`/vendas/${criacao.body.id}/confirmar-pagamento`)
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send();

      const resposta = await request(app)
        .post(`/vendas/${criacao.body.id}/confirmar-pagamento`)
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send();

      assert.strictEqual(resposta.status, 409);
    });

    it('deve retornar 404 ao confirmar pagamento de uma venda inexistente', async () => {
      const cliente = await criarCliente(db);
      const app = criarAppDeTeste();

      const resposta = await request(app)
        .post('/vendas/999999/confirmar-pagamento')
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send();

      assert.strictEqual(resposta.status, 404);
    });
  });
});
