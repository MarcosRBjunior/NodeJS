import { Link } from 'react-router-dom';
import { BookCover } from './BookCover';
import { CategoryBadge } from './CategoryBadge';
import { formatarPreco } from '../utils/formatarPreco';
import { useCart } from '../context/CartContext';

export function BookCard({ livro, nomeAutor }) {
  const { adicionarItem } = useCart();

  return (
    <article className="book-card">
      <Link to={`/livros/${livro.id}`} className="book-card__link">
        <BookCover capaUrl={livro.capa_url} titulo={livro.titulo} categoria={livro.categoria} className="book-card__cover" />
        <div className="book-card__info">
          <CategoryBadge categoria={livro.categoria} />
          <h3 className="book-card__titulo">{livro.titulo}</h3>
          {nomeAutor && <p className="book-card__autor">{nomeAutor}</p>}
          <p className="book-card__preco">{formatarPreco(livro.preco)}</p>
        </div>
      </Link>
      <button type="button" className="btn btn--secondary btn--full" onClick={() => adicionarItem(livro)}>
        Adicionar ao carrinho
      </button>
    </article>
  );
}
