import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { obterConexao } from '#db/connection.js';
import { criarAppDeTeste } from '#test/support/app-teste.js';

const db = obterConexao();
const app = criarAppDeTeste();

describe('Auth E2E', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE clientes RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  describe('POST /auth/registrar', () => {
    it('deve registrar um cliente novo e retornar cliente + token', async () => {
      const resposta = await request(app)
        .post('/auth/registrar')
        .send({ nome: 'Ana Teste', email: 'ana@teste.com', senha: 'senha1234' });

      assert.strictEqual(resposta.status, 201);
      assert.ok(resposta.body.token);
      assert.strictEqual(resposta.body.cliente.email, 'ana@teste.com');
      assert.strictEqual(resposta.body.cliente.papel, 'cliente');
      assert.strictEqual(resposta.body.cliente.senha_hash, undefined);
    });

    it('deve retornar 400 ao registrar com email já cadastrado', async () => {
      await request(app).post('/auth/registrar').send({ nome: 'Ana', email: 'dup@teste.com', senha: 'senha1234' });

      const resposta = await request(app)
        .post('/auth/registrar')
        .send({ nome: 'Outra Ana', email: 'dup@teste.com', senha: 'senha5678' });

      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 400 ao registrar com email em formato inválido', async () => {
      const resposta = await request(app)
        .post('/auth/registrar')
        .send({ nome: 'Ana', email: 'nao-e-email', senha: 'senha1234' });

      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 400 ao registrar com senha curta', async () => {
      const resposta = await request(app)
        .post('/auth/registrar')
        .send({ nome: 'Ana', email: 'ana2@teste.com', senha: '123' });

      assert.strictEqual(resposta.status, 400);
    });
  });

  describe('POST /auth/login', () => {
    it('deve autenticar com email e senha corretos', async () => {
      await request(app).post('/auth/registrar').send({ nome: 'Ana', email: 'login@teste.com', senha: 'senha1234' });

      const resposta = await request(app).post('/auth/login').send({ email: 'login@teste.com', senha: 'senha1234' });

      assert.strictEqual(resposta.status, 200);
      assert.ok(resposta.body.token);
    });

    it('deve retornar 400 com senha incorreta', async () => {
      await request(app).post('/auth/registrar').send({ nome: 'Ana', email: 'login2@teste.com', senha: 'senha1234' });

      const resposta = await request(app).post('/auth/login').send({ email: 'login2@teste.com', senha: 'errada123' });

      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 400 para email não cadastrado', async () => {
      const resposta = await request(app).post('/auth/login').send({ email: 'ninguem@teste.com', senha: 'senha1234' });
      assert.strictEqual(resposta.status, 400);
    });
  });

  describe('GET /auth/me', () => {
    it('deve retornar os dados do cliente autenticado', async () => {
      const registro = await request(app)
        .post('/auth/registrar')
        .send({ nome: 'Ana', email: 'me@teste.com', senha: 'senha1234' });

      const resposta = await request(app).get('/auth/me').set('Authorization', `Bearer ${registro.body.token}`);

      assert.strictEqual(resposta.status, 200);
      assert.strictEqual(resposta.body.email, 'me@teste.com');
    });

    it('deve retornar 401 sem token', async () => {
      const resposta = await request(app).get('/auth/me');
      assert.strictEqual(resposta.status, 401);
    });

    it('deve retornar 401 com token inválido', async () => {
      const resposta = await request(app).get('/auth/me').set('Authorization', 'Bearer token-invalido');
      assert.strictEqual(resposta.status, 401);
    });
  });
});
