import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { obterConexao } from '#db/connection.js';
import Livro from '#models/livro.js';
import { criarAutor, criarEditora } from '#test/support/fabricas.js';

const db = obterConexao();

describe('Livro (integração)', () => {
  before(() => {
    Livro.configurarDB(db);
  });

  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE livros, autores, editoras RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  it('deve criar um livro associado a um autor e uma editora existentes', async () => {
    const autor = await criarAutor(db);
    const editora = await criarEditora(db);

    const livro = new Livro({ titulo: 'Dom Casmurro', paginas: 256, autor_id: autor.id, editora_id: editora.id });
    const resultado = await livro.salvar();

    assert.ok(resultado.id);
    assert.strictEqual(resultado.titulo, 'Dom Casmurro');
  });

  it('deve buscar um livro pelo id', async () => {
    const autor = await criarAutor(db);
    const editora = await criarEditora(db);
    const criado = await new Livro({ titulo: 'Memórias Póstumas', paginas: 208, autor_id: autor.id, editora_id: editora.id }).salvar();

    const encontrado = await Livro.pegarPeloId(criado.id);

    assert.strictEqual(encontrado.titulo, 'Memórias Póstumas');
  });

  it('deve listar todos os livros cadastrados', async () => {
    const autor = await criarAutor(db);
    const editora = await criarEditora(db);
    await new Livro({ titulo: 'Livro A', paginas: 100, autor_id: autor.id, editora_id: editora.id }).salvar();
    await new Livro({ titulo: 'Livro B', paginas: 150, autor_id: autor.id, editora_id: editora.id }).salvar();

    const livros = await Livro.pegarTodos();

    assert.strictEqual(livros.length, 2);
  });

  it('deve filtrar livros por trecho do título e faixa de páginas', async () => {
    const autor = await criarAutor(db);
    const editora = await criarEditora(db);
    await new Livro({ titulo: 'Dom Casmurro', paginas: 256, autor_id: autor.id, editora_id: editora.id }).salvar();
    await new Livro({ titulo: 'Dom Quixote', paginas: 900, autor_id: autor.id, editora_id: editora.id }).salvar();

    const encontrados = await Livro.queryComFiltro({ titulo: 'dom', maxPaginas: 300 });

    assert.strictEqual(encontrados.length, 1);
    assert.strictEqual(encontrados[0].titulo, 'Dom Casmurro');
  });
});
