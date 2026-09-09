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

  it('deve registrar uma venda com dados válidos, associá-la ao cliente autenticado e enviar email à editora', async () => {
    // arrange
    const livro = await criarLivro(db);
    const cliente = await criarCliente(db);
    const emailGateway = { enviar: mock.fn(async () => {}) };
    const app = criarAppDeTeste({ emailGateway });

    // act
    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

    // assert
    assert.strictEqual(resposta.status, 201);
    assert.strictEqual(resposta.body.cliente_id, cliente.id);
    assert.strictEqual(resposta.body.quantidade, 1);
    assert.strictEqual(emailGateway.enviar.mock.callCount(), 1);
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

  it('deve retornar 409 ao registrar venda de um livro sem estoque disponível', async () => {
    const livro = await criarLivro(db, { estoque_quantidade: 0 });
    const cliente = await criarCliente(db);
    const app = criarAppDeTeste();

    const resposta = await request(app)
      .post('/vendas')
      .set('Authorization', `Bearer ${tokenPara(cliente)}`)
      .send({ idLivro: livro.id, valor: 100, modoPagamento: 'PIX', quantidade: 1 });

    assert.strictEqual(resposta.status, 409);
  });

  it('deve retornar 409 ao pedir mais unidades do que o estoque disponível', async () => {
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
});
