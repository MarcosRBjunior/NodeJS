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

  async salvar(conexao = this.constructor.db) {
    const dados = {};
    for (const campo of this.constructor.camposInseriveis) {
      dados[campo] = this[campo];
    }

    const [registro] = await conexao(this.constructor.tabela).insert(dados).returning('*');
    Object.assign(this, registro);
    return registro;
  }

  static async atualizarPeloId(id, dados, conexao = this.db) {
    const [registro] = await conexao(this.tabela).where({ id }).update(dados).returning('*');
    return registro;
  }
}
