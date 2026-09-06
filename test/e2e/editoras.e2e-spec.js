import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { obterConexao } from '#db/connection.js';
import { criarAppDeTeste } from '#test/support/app-teste.js';

const db = obterConexao();
const app = criarAppDeTeste();

describe('Editoras E2E', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE editoras RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  describe('casos de sucesso', () => {
    it('deve cadastrar uma editora com dados válidos e retornar 201', async () => {
      const resposta = await request(app)
        .post('/editoras')
        .send({ nome: 'Companhia das Letras', cidade: 'São Paulo', email: 'contato@cdl.com' });

      assert.strictEqual(resposta.status, 201);
      assert.ok(resposta.body.id);
    });

    it('deve listar as editoras cadastradas', async () => {
      await request(app).post('/editoras').send({ nome: 'Record', cidade: 'Rio de Janeiro', email: 'contato@record.com' });

      const resposta = await request(app).get('/editoras');

      assert.strictEqual(resposta.status, 200);
      assert.strictEqual(resposta.body.length, 1);
    });
  });

  describe('casos de erro', () => {
    it('deve retornar 400 ao cadastrar editora com dados inválidos', async () => {
      const resposta = await request(app).post('/editoras').send({});
      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 404 ao buscar uma editora inexistente', async () => {
      const resposta = await request(app).get('/editoras/999999');
      assert.strictEqual(resposta.status, 404);
    });

    // Pendência conhecida (herdada do Teste_E2E original): validação de formato de
    // email ainda não implementada nesta camada.
    it.todo('deve retornar 400 ao cadastrar editora com email em formato inválido');
  });
});
