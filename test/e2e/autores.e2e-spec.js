import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { obterConexao } from '#db/connection.js';
import { criarAppDeTeste } from '#test/support/app-teste.js';
import { criarAdmin, criarCliente, tokenPara } from '#test/support/fabricas.js';

const db = obterConexao();
const app = criarAppDeTeste();

describe('Autores E2E', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE autores, clientes RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  describe('casos de sucesso', () => {
    it('deve cadastrar um autor com dados válidos e retornar 201', async () => {
      const admin = await criarAdmin(db);
      const resposta = await request(app)
        .post('/autores')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ nome: 'Machado de Assis', nacionalidade: 'Brasileiro' });

      assert.strictEqual(resposta.status, 201);
      assert.ok(resposta.body.id);
    });

    it('deve listar os autores cadastrados', async () => {
      const admin = await criarAdmin(db);
      await request(app)
        .post('/autores')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ nome: 'Machado de Assis', nacionalidade: 'Brasileiro' });

      const resposta = await request(app).get('/autores');

      assert.strictEqual(resposta.status, 200);
      assert.strictEqual(resposta.body.length, 1);
    });

    it('deve paginar e ordenar os autores por nome', async () => {
      const admin = await criarAdmin(db);
      const token = tokenPara(admin);
      await request(app).post('/autores').set('Authorization', `Bearer ${token}`).send({ nome: 'Zezé', nacionalidade: 'Brasileiro' });
      await request(app).post('/autores').set('Authorization', `Bearer ${token}`).send({ nome: 'Ana', nacionalidade: 'Brasileira' });

      const resposta = await request(app).get('/autores?ordenacao=nome:asc&limite=1&pagina=1');

      assert.strictEqual(resposta.status, 200);
      assert.strictEqual(resposta.body.length, 1);
      assert.strictEqual(resposta.body[0].nome, 'Ana');
    });

    it('deve buscar um autor pelo id', async () => {
      const admin = await criarAdmin(db);
      const criado = await request(app)
        .post('/autores')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ nome: 'Clarice Lispector', nacionalidade: 'Brasileira' });

      const resposta = await request(app).get(`/autores/${criado.body.id}`);

      assert.strictEqual(resposta.status, 200);
      assert.strictEqual(resposta.body.nome, 'Clarice Lispector');
    });
  });

  describe('casos de erro', () => {
    it('deve retornar 401 ao cadastrar autor sem autenticação', async () => {
      const resposta = await request(app).post('/autores').send({ nome: 'Sem Token', nacionalidade: 'Brasileiro' });
      assert.strictEqual(resposta.status, 401);
    });

    it('deve retornar 403 ao cadastrar autor autenticado como cliente comum', async () => {
      const cliente = await criarCliente(db);
      const resposta = await request(app)
        .post('/autores')
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send({ nome: 'Cliente Tentando', nacionalidade: 'Brasileiro' });

      assert.strictEqual(resposta.status, 403);
    });

    it('deve retornar 400 ao cadastrar autor com dados inválidos', async () => {
      const admin = await criarAdmin(db);
      const resposta = await request(app).post('/autores').set('Authorization', `Bearer ${tokenPara(admin)}`).send({});
      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 400 ao cadastrar autor sem nacionalidade', async () => {
      const admin = await criarAdmin(db);
      const resposta = await request(app)
        .post('/autores')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ nome: 'Autor Sem Nacionalidade' });
      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 404 ao buscar um autor inexistente', async () => {
      const resposta = await request(app).get('/autores/999999');
      assert.strictEqual(resposta.status, 404);
    });

    it('deve retornar 400 ao paginar com uma coluna de ordenação não permitida', async () => {
      const resposta = await request(app).get('/autores?ordenacao=senha:asc');
      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 400 ao paginar com o parâmetro "ordenacao" repetido', async () => {
      const resposta = await request(app).get('/autores?ordenacao=nome:asc&ordenacao=id:desc');
      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 400 ao enviar um corpo que não é um JSON válido', async () => {
      const resposta = await request(app)
        .post('/autores')
        .set('Content-Type', 'application/json')
        .send('{invalido');

      assert.strictEqual(resposta.status, 400);
    });
  });
});
