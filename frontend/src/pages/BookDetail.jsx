import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { BookCover } from '../components/BookCover';
import { CategoryBadge } from '../components/CategoryBadge';
import { formatarPreco } from '../utils/formatarPreco';
import { useCart } from '../context/CartContext';

export function BookDetail() {
  const { id } = useParams();
  const { adicionarItem } = useCart();
  const [livro, setLivro] = useState(null);
  const [autor, setAutor] = useState(null);
  const [editora, setEditora] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [erro, setErro] = useState(null);
  const [adicionado, setAdicionado] = useState(false);

  useEffect(() => {
    setErro(null);
    setLivro(null);
    api
      .buscarLivroPorId(id)
      .then((dados) => {
        setLivro(dados);
        api.buscarAutorPorId(dados.autor_id).then(setAutor).catch(() => {});
        api.buscarEditoraPorId(dados.editora_id).then(setEditora).catch(() => {});
      })
      .catch((e) => setErro(e.message));
  }, [id]);

  if (erro) return <p className="estado-erro">Não deu pra carregar esse livro: {erro}</p>;
  if (!livro) return <p className="estado-info">Carregando...</p>;

  return (
    <section className="detalhe-livro">
      <BookCover capaUrl={livro.capa_url} titulo={livro.titulo} categoria={livro.categoria} className="detalhe-livro__capa" />

      <div className="detalhe-livro__info">
        <CategoryBadge categoria={livro.categoria} />
        <h1>{livro.titulo}</h1>
        {autor && <p className="detalhe-livro__autor">por {autor.nome}</p>}
        <p className="detalhe-livro__preco">{formatarPreco(livro.preco)}</p>

        <ul className="detalhe-livro__specs">
          <li>
            <strong>Páginas:</strong> {livro.paginas}
          </li>
          {editora && (
            <li>
              <strong>Editora:</strong> {editora.nome} ({editora.cidade})
            </li>
          )}
        </ul>

        <div className="detalhe-livro__acoes">
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
            aria-label="Quantidade"
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              adicionarItem(livro, quantidade);
              setAdicionado(true);
            }}
          >
            Adicionar ao carrinho
          </button>
        </div>

        {adicionado && (
          <p className="estado-sucesso">
            Adicionado ao carrinho! <Link to="/carrinho">Ver carrinho</Link>
          </p>
        )}
      </div>
    </section>
  );
}
