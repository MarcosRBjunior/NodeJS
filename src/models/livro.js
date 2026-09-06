import { RepositorioBase } from './RepositorioBase.js';

function escaparCoringasLike(valor) {
  return valor.replace(/[\\%_]/g, '\\$&');
}

export default class Livro extends RepositorioBase {
  static tabela = 'livros';
  static camposInseriveis = ['titulo', 'paginas', 'autor_id', 'editora_id'];

  constructor({ id, titulo, paginas, autor_id, editora_id } = {}) {
    super();
    this.id = id;
    this.titulo = titulo;
    this.paginas = paginas;
    this.autor_id = autor_id;
    this.editora_id = editora_id;
  }

  static queryComFiltro({ titulo, autor_id, editora_id, minPaginas, maxPaginas } = {}) {
    const consulta = Livro.query();

    if (titulo) consulta.whereILike('titulo', `%${escaparCoringasLike(titulo)}%`);
    if (autor_id) consulta.where({ autor_id });
    if (editora_id) consulta.where({ editora_id });
    if (minPaginas) consulta.where('paginas', '>=', Number(minPaginas));
    if (maxPaginas) consulta.where('paginas', '<=', Number(maxPaginas));

    return consulta;
  }
}
