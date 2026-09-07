import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { BookCard } from '../components/BookCard';
import { useLookups } from '../hooks/useLookups';

const LIMITE_POR_PAGINA = 8;

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const { autoresPorId } = useLookups();

  const busca = searchParams.get('busca') || '';
  const categoria = searchParams.get('categoria') || '';
  const ordenacao = searchParams.get('ordenacao') || 'id:desc';
  const pagina = Number(searchParams.get('pagina') || '1');

  useEffect(() => {
    setCarregando(true);
    setErro(null);

    const params = { limite: LIMITE_POR_PAGINA, pagina, ordenacao, titulo: busca || undefined, categoria: categoria || undefined };
    const usaFiltro = Boolean(busca || categoria);
    const requisicao = usaFiltro ? api.buscarLivros(params) : api.listarLivros(params);

    requisicao
      .then(setLivros)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [busca, categoria, ordenacao, pagina]);

  function atualizarParam(chave, valor) {
    const novos = new URLSearchParams(searchParams);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    novos.delete('pagina');
    setSearchParams(novos);
  }

  function irParaPagina(novaPagina) {
    const novos = new URLSearchParams(searchParams);
    novos.set('pagina', String(novaPagina));
    setSearchParams(novos);
  }

  return (
    <section className="secao">
      <h1 className="secao__titulo">Catálogo</h1>

      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar por título..."
          defaultValue={busca}
          onKeyDown={(e) => e.key === 'Enter' && atualizarParam('busca', e.currentTarget.value)}
          onBlur={(e) => atualizarParam('busca', e.currentTarget.value)}
        />

        <select value={categoria} onChange={(e) => atualizarParam('categoria', e.target.value)}>
          <option value="">Todas as categorias</option>
          <option value="Tecnologia">Tecnologia</option>
          <option value="Idiomas">Idiomas</option>
        </select>

        <select value={ordenacao} onChange={(e) => atualizarParam('ordenacao', e.target.value)}>
          <option value="id:desc">Mais recentes</option>
          <option value="titulo:asc">Título (A-Z)</option>
          <option value="titulo:desc">Título (Z-A)</option>
          <option value="paginas:asc">Menos páginas</option>
          <option value="paginas:desc">Mais páginas</option>
        </select>
      </div>

      {carregando && <p className="estado-info">Carregando livros...</p>}
      {erro && <p className="estado-erro">Não deu pra carregar os livros: {erro}</p>}
      {!carregando && !erro && livros.length === 0 && <p className="estado-info">Nenhum livro encontrado com esses filtros.</p>}

      <div className="grid-livros">
        {livros.map((livro) => (
          <BookCard key={livro.id} livro={livro} nomeAutor={autoresPorId[livro.autor_id]?.nome} />
        ))}
      </div>

      <div className="paginacao">
        <button type="button" disabled={pagina <= 1} onClick={() => irParaPagina(pagina - 1)}>
          Anterior
        </button>
        <span>Página {pagina}</span>
        <button type="button" disabled={livros.length < LIMITE_POR_PAGINA} onClick={() => irParaPagina(pagina + 1)}>
          Próxima
        </button>
      </div>
    </section>
  );
}
