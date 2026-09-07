import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';

export function Header() {
  const { totalItens } = useCart();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  function aoSubmeterBusca(evento) {
    evento.preventDefault();
    navigate(busca ? `/catalogo?busca=${encodeURIComponent(busca)}` : '/catalogo');
  }

  return (
    <header className="header">
      <div className="header__container">
        <NavLink to="/" className="header__logo">
          Library<span className="header__logo-accent">Fast</span>
        </NavLink>

        <nav className="header__nav">
          <NavLink to="/catalogo" className={({ isActive }) => (isActive ? 'header__link header__link--ativo' : 'header__link')}>
            Catálogo
          </NavLink>
          <NavLink to="/catalogo?categoria=Tecnologia" className="header__link">
            Tecnologia
          </NavLink>
          <NavLink to="/catalogo?categoria=Idiomas" className="header__link">
            Idiomas
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'header__link header__link--ativo' : 'header__link')}>
            Cadastrar
          </NavLink>
        </nav>

        <form className="header__busca" onSubmit={aoSubmeterBusca} role="search">
          <input
            type="search"
            placeholder="Buscar por título..."
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            aria-label="Buscar livros por título"
          />
          <button type="submit" aria-label="Buscar">
            <SearchIcon />
          </button>
        </form>

        <NavLink to="/carrinho" className="header__carrinho" aria-label="Carrinho">
          <CartIcon />
          {totalItens > 0 && <span className="header__carrinho-badge">{totalItens}</span>}
        </NavLink>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
