import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { LivrosController } from '#controllers/livros.controller.js';
import { criarMockResponse } from '#test/support/mock-response.js';
import { assertMock } from '#test/support/assert-mock.js';

describe('LivrosController (integração — service mockado)', () => {
  it('deve delegar a listagem paginável ao service e chamar next()', () => {
    const consulta = { select: true };
    const livrosService = { consultarLivros: mock.fn(() => consulta) };
    const controller = new LivrosController(livrosService);
    const req = {};
    const next = mock.fn();

    controller.listarLivros(req, {}, next);

    assert.strictEqual(req.consultaPaginavel, consulta);
    assert.strictEqual(next.mock.callCount(), 1);
  });

  it('deve responder 200 com o livro encontrado pelo id', async () => {
    const livro = { id: 1, titulo: 'Dom Casmurro' };
    const livrosService = { buscarLivroPorId: mock.fn(async () => livro) };
    const controller = new LivrosController(livrosService);
    const res = criarMockResponse();

    await controller.buscarLivroPorId({ params: { id: 1 } }, res, mock.fn());

    assertMock(res.status, [200]);
    assertMock(res.send, [livro]);
  });

  it('deve chamar next com NaoEncontrado quando o livro não é encontrado', async () => {
    const livrosService = { buscarLivroPorId: mock.fn(async () => undefined) };
    const controller = new LivrosController(livrosService);
    const next = mock.fn();

    await controller.buscarLivroPorId({ params: { id: 999 } }, criarMockResponse(), next);

    assert.strictEqual(next.mock.callCount(), 1);
    assert.strictEqual(next.mock.calls[0].arguments[0].status, 404);
  });

  it('deve responder 201 ao cadastrar um livro válido', async () => {
    const livroCriado = { id: 1, titulo: 'Dom Casmurro', paginas: 256, autor_id: 1, editora_id: 1 };
    const livrosService = { cadastrarLivro: mock.fn(async () => livroCriado) };
    const controller = new LivrosController(livrosService);
    const res = criarMockResponse();

    await controller.cadastrarLivro({ body: { titulo: 'Dom Casmurro', paginas: 256, autor_id: 1, editora_id: 1 } }, res, mock.fn());

    assertMock(res.status, [201]);
    assertMock(res.send, [livroCriado]);
  });

  it('deve chamar next com RequisicaoIncorreta ao cadastrar livro sem titulo', async () => {
    const livrosService = { cadastrarLivro: mock.fn() };
    const controller = new LivrosController(livrosService);
    const next = mock.fn();

    await controller.cadastrarLivro({ body: { paginas: 256, autor_id: 1, editora_id: 1 } }, criarMockResponse(), next);

    assert.strictEqual(next.mock.callCount(), 1);
    assert.strictEqual(next.mock.calls[0].arguments[0].status, 400);
    assert.strictEqual(livrosService.cadastrarLivro.mock.callCount(), 0);
  });
});
