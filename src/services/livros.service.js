import Livro from '#models/livro.js';

export class LivrosService {
  constructor(databaseConnection) {
    Livro.configurarDB(databaseConnection);
  }

  async listarLivros() {
    return Livro.pegarTodos();
  }

  consultarLivros() {
    return Livro.query();
  }

  consultarLivrosComFiltro(filtro) {
    return Livro.queryComFiltro(filtro);
  }

  async buscarLivroPorId(id) {
    return Livro.pegarPeloId(id);
  }

  async cadastrarLivro(dados) {
    return new Livro(dados).salvar();
  }
}
