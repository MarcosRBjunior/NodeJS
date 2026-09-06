import Editora from '#models/editora.js';

export class EditorasService {
  constructor(databaseConnection) {
    Editora.configurarDB(databaseConnection);
  }

  async listarEditoras() {
    return Editora.pegarTodos();
  }

  consultarEditoras() {
    return Editora.query();
  }

  async buscarEditoraPorId(id) {
    return Editora.pegarPeloId(id);
  }

  async cadastrarEditora(dados) {
    return new Editora(dados).salvar();
  }
}
