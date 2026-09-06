import { RepositorioBase } from './RepositorioBase.js';

export default class Editora extends RepositorioBase {
  static tabela = 'editoras';
  static camposInseriveis = ['nome', 'cidade', 'email'];

  constructor({ id, nome, cidade, email } = {}) {
    super();
    this.id = id;
    this.nome = nome;
    this.cidade = cidade;
    this.email = email;
  }
}
