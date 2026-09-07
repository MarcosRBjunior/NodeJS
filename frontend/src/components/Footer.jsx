export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div>
          <p className="footer__logo">
            Library<span className="header__logo-accent">Fast</span>
          </p>
          <p className="footer__texto">Livros de tecnologia e idiomas pra quem quer aprender rápido.</p>
        </div>

        <div className="footer__coluna">
          <h4>Categorias</h4>
          <a href="/catalogo?categoria=Tecnologia">Tecnologia</a>
          <a href="/catalogo?categoria=Idiomas">Idiomas</a>
        </div>

        <div className="footer__coluna">
          <h4>Loja</h4>
          <a href="/catalogo">Catálogo completo</a>
          <a href="/carrinho">Carrinho</a>
        </div>
      </div>
      <p className="footer__copy">© {new Date().getFullYear()} Library Fast. Projeto de estudo.</p>
    </footer>
  );
}
