import { RepositorioBase } from './RepositorioBase.js';

export default class Cliente extends RepositorioBase {
  static tabela = 'clientes';
  static camposInseriveis = ['nome', 'email', 'senha_hash', 'papel'];

  constructor({ id, nome, email, senha_hash, papel = 'cliente' } = {}) {
    super();
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senha_hash = senha_hash;
    this.papel = papel;
  }

  static async pegarPeloEmail(email) {
    return this.db(this.tabela).where({ email }).first();
  }
}
