import Autor from '#models/autor.js';

export class AutoresService {
  constructor(databaseConnection) {
    Autor.configurarDB(databaseConnection);
  }

  async listarAutores() {
    return Autor.pegarTodos();
  }

  consultarAutores() {
    return Autor.query();
  }

  async buscarAutorPorId(id) {
    return Autor.pegarPeloId(id);
  }

  async cadastrarAutor(dados) {
    return new Autor(dados).salvar();
  }
}
