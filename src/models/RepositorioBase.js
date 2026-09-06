export class RepositorioBase {
  static db;
  static tabela;
  static camposInseriveis = [];

  static configurarDB(conexao) {
    this.db = conexao;
  }

  static query() {
    return this.db(this.tabela).select();
  }

  static async pegarTodos() {
    return this.query();
  }

  static async pegarPeloId(id) {
    return this.db(this.tabela).where({ id }).first();
  }

  async salvar() {
    const dados = {};
    for (const campo of this.constructor.camposInseriveis) {
      dados[campo] = this[campo];
    }

    const [registro] = await this.constructor.db(this.constructor.tabela).insert(dados).returning('*');
    Object.assign(this, registro);
    return registro;
  }
}
