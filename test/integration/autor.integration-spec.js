import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { obterConexao } from '#db/connection.js';
import Autor from '#models/autor.js';

const db = obterConexao();

describe('Autor (integração)', () => {
  before(() => {
    Autor.configurarDB(db);
  });

  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE autores RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  it('deve criar um autor no banco de dados', async () => {
    const autor = new Autor({ nome: 'Machado de Assis', nacionalidade: 'Brasileiro' });
    const resultado = await autor.salvar();
    assert.ok(resultado.id);
    assert.strictEqual(resultado.nome, 'Machado de Assis');
  });

  it('deve buscar um autor pelo id', async () => {
    const criado = await new Autor({ nome: 'Clarice Lispector', nacionalidade: 'Brasileira' }).salvar();
    const encontrado = await Autor.pegarPeloId(criado.id);
    assert.strictEqual(encontrado.nome, 'Clarice Lispector');
  });

  it('deve listar todos os autores cadastrados', async () => {
    await new Autor({ nome: 'Jorge Amado', nacionalidade: 'Brasileiro' }).salvar();
    await new Autor({ nome: 'José Saramago', nacionalidade: 'Português' }).salvar();

    const autores = await Autor.pegarTodos();

    assert.strictEqual(autores.length, 2);
  });
});
