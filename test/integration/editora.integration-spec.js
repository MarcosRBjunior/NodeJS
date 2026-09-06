import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { obterConexao } from '#db/connection.js';
import Editora from '#models/editora.js';

const db = obterConexao();

describe('Editora (integração)', () => {
  before(() => {
    Editora.configurarDB(db);
  });

  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE editoras RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  it('deve criar uma editora no banco de dados', async () => {
    const editora = new Editora({ nome: 'Companhia das Letras', cidade: 'São Paulo', email: 'contato@cdl.com' });
    const resultado = await editora.salvar();
    assert.ok(resultado.id);
    assert.strictEqual(resultado.nome, 'Companhia das Letras');
  });

  it('deve buscar uma editora pelo id', async () => {
    const criada = await new Editora({ nome: 'Record', cidade: 'Rio de Janeiro', email: 'contato@record.com' }).salvar();
    const encontrada = await Editora.pegarPeloId(criada.id);
    assert.strictEqual(encontrada.cidade, 'Rio de Janeiro');
  });
});
