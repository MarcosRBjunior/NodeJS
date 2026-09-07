import { RepositorioBase } from './RepositorioBase.js';

function escaparCoringasLike(valor) {
  return valor.replace(/[\\%_]/g, '\\$&');
}

export default class Livro extends RepositorioBase {
  static tabela = 'livros';
  static camposInseriveis = ['titulo', 'paginas', 'autor_id', 'editora_id', 'preco', 'capa_url', 'categoria'];

  constructor({ id, titulo, paginas, autor_id, editora_id, preco = 0, capa_url = null, categoria = null } = {}) {
    super();
    this.id = id;
    this.titulo = titulo;
    this.paginas = paginas;
    this.autor_id = autor_id;
    this.editora_id = editora_id;
    this.preco = preco;
    this.capa_url = capa_url;
    this.categoria = categoria;
  }

  static queryComFiltro({ titulo, autor_id, editora_id, minPaginas, maxPaginas, categoria } = {}) {
    const consulta = Livro.query();

    if (titulo) consulta.whereILike('titulo', `%${escaparCoringasLike(titulo)}%`);
    if (autor_id) consulta.where({ autor_id });
    if (editora_id) consulta.where({ editora_id });
    if (minPaginas) consulta.where('paginas', '>=', Number(minPaginas));
    if (maxPaginas) consulta.where('paginas', '<=', Number(maxPaginas));
    if (categoria) consulta.where({ categoria });

    return consulta;
  }
}
