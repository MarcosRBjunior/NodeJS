import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { obterConexao } from '#db/connection.js';
import { criarAppDeTeste } from '#test/support/app-teste.js';
import { criarAutor, criarEditora, criarAdmin, criarCliente, tokenPara } from '#test/support/fabricas.js';

const db = obterConexao();
const app = criarAppDeTeste();

describe('Livros E2E', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE livros, autores, editoras, clientes RESTART IDENTITY CASCADE');
  });

  after(async () => {
    await db.destroy();
  });

  describe('casos de sucesso', () => {
    it('deve cadastrar um livro com dados válidos e retornar 201', async () => {
      const autor = await criarAutor(db);
      const editora = await criarEditora(db);
      const admin = await criarAdmin(db);

      const resposta = await request(app)
        .post('/livros')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ titulo: 'Dom Casmurro', paginas: 256, autor_id: autor.id, editora_id: editora.id });

      assert.strictEqual(resposta.status, 201);
      assert.ok(resposta.body.id);
    });

    it('deve listar os livros cadastrados', async () => {
      const autor = await criarAutor(db);
      const editora = await criarEditora(db);
      const admin = await criarAdmin(db);
      await request(app)
        .post('/livros')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ titulo: 'Dom Casmurro', paginas: 256, autor_id: autor.id, editora_id: editora.id });

      const resposta = await request(app).get('/livros');

      assert.strictEqual(resposta.status, 200);
      assert.strictEqual(resposta.body.length, 1);
    });

    it('deve buscar livros por trecho do título e faixa de páginas', async () => {
      const autor = await criarAutor(db);
      const editora = await criarEditora(db);
      const admin = await criarAdmin(db);
      const token = tokenPara(admin);
      await request(app).post('/livros').set('Authorization', `Bearer ${token}`).send({ titulo: 'Dom Casmurro', paginas: 256, autor_id: autor.id, editora_id: editora.id });
      await request(app).post('/livros').set('Authorization', `Bearer ${token}`).send({ titulo: 'Dom Quixote', paginas: 900, autor_id: autor.id, editora_id: editora.id });

      const resposta = await request(app).get('/livros/busca?titulo=dom&maxPaginas=300');

      assert.strictEqual(resposta.status, 200);
      assert.strictEqual(resposta.body.length, 1);
      assert.strictEqual(resposta.body[0].titulo, 'Dom Casmurro');
    });
  });

  describe('casos de erro', () => {
    it('deve retornar 401 ao cadastrar livro sem autenticação', async () => {
      const autor = await criarAutor(db);
      const editora = await criarEditora(db);

      const resposta = await request(app)
        .post('/livros')
        .send({ titulo: 'Sem Token', paginas: 100, autor_id: autor.id, editora_id: editora.id });

      assert.strictEqual(resposta.status, 401);
    });

    it('deve retornar 403 ao cadastrar livro autenticado como cliente comum', async () => {
      const autor = await criarAutor(db);
      const editora = await criarEditora(db);
      const cliente = await criarCliente(db);

      const resposta = await request(app)
        .post('/livros')
        .set('Authorization', `Bearer ${tokenPara(cliente)}`)
        .send({ titulo: 'Cliente Tentando', paginas: 100, autor_id: autor.id, editora_id: editora.id });

      assert.strictEqual(resposta.status, 403);
    });

    it('deve retornar 400 ao cadastrar livro com dados inválidos', async () => {
      const admin = await criarAdmin(db);
      const resposta = await request(app).post('/livros').set('Authorization', `Bearer ${tokenPara(admin)}`).send({});
      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 400 ao cadastrar livro com paginas igual a zero', async () => {
      const autor = await criarAutor(db);
      const editora = await criarEditora(db);
      const admin = await criarAdmin(db);

      const resposta = await request(app)
        .post('/livros')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ titulo: 'Livro Vazio', paginas: 0, autor_id: autor.id, editora_id: editora.id });

      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 404 ao buscar um livro inexistente', async () => {
      const resposta = await request(app).get('/livros/999999');
      assert.strictEqual(resposta.status, 404);
    });

    it('deve retornar 400 ao cadastrar livro com autor_id inexistente', async () => {
      const editora = await criarEditora(db);
      const admin = await criarAdmin(db);

      const resposta = await request(app)
        .post('/livros')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ titulo: 'Livro Órfão', paginas: 100, autor_id: 999999, editora_id: editora.id });

      assert.strictEqual(resposta.status, 400);
    });

    it('deve retornar 400 ao cadastrar livro com editora_id inexistente', async () => {
      const autor = await criarAutor(db);
      const admin = await criarAdmin(db);

      const resposta = await request(app)
        .post('/livros')
        .set('Authorization', `Bearer ${tokenPara(admin)}`)
        .send({ titulo: 'Livro Órfão', paginas: 100, autor_id: autor.id, editora_id: 999999 });

      assert.strictEqual(resposta.status, 400);
    });
  });
});
