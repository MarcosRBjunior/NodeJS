import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { obterConexao } from '#db/connection.js';
import Cliente from '#models/cliente.js';

const db = obterConexao();

describe('Cliente (integração)', () => {
  before(() => {
    Cliente.configurarDB(db);
  });

  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE clientes RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  it('deve criar um cliente com papel padrão "cliente"', async () => {
    const cliente = new Cliente({ nome: 'Ana', email: 'ana@teste.com', senha_hash: 'hash-fake' });
    const resultado = await cliente.salvar();

    assert.ok(resultado.id);
    assert.strictEqual(resultado.papel, 'cliente');
  });

  it('deve criar um cliente com papel admin quando informado', async () => {
    const cliente = new Cliente({ nome: 'Root', email: 'root@teste.com', senha_hash: 'hash-fake', papel: 'admin' });
    const resultado = await cliente.salvar();

    assert.strictEqual(resultado.papel, 'admin');
  });

  it('deve buscar um cliente pelo email', async () => {
    await new Cliente({ nome: 'Ana', email: 'busca@teste.com', senha_hash: 'hash-fake' }).salvar();

    const encontrado = await Cliente.pegarPeloEmail('busca@teste.com');

    assert.strictEqual(encontrado.nome, 'Ana');
  });

  it('deve retornar undefined ao buscar um email inexistente', async () => {
    const encontrado = await Cliente.pegarPeloEmail('naoexiste@teste.com');
    assert.strictEqual(encontrado, undefined);
  });
});
