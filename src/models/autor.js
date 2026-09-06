import { RepositorioBase } from './RepositorioBase.js';

export default class Autor extends RepositorioBase {
  static tabela = 'autores';
  static camposInseriveis = ['nome', 'nacionalidade'];

  constructor({ id, nome, nacionalidade } = {}) {
    super();
    this.id = id;
    this.nome = nome;
    this.nacionalidade = nacionalidade;
  }
}
