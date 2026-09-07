import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { BookCard } from '../components/BookCard';
import { useLookups } from '../hooks/useLookups';

export function Home() {
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const { autoresPorId } = useLookups();

  useEffect(() => {
    api
      .listarLivros({ limite: 4, ordenacao: 'id:desc' })
      .then(setLivros)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero__conteudo">
          <h1>
            Leitura que acelera <span className="hero__destaque">seu progresso</span>
          </h1>
          <p>
            Livros de tecnologia pra evoluir na carreira e livros de idiomas pra destravar a fluência — tudo num só lugar,
            com entrega rápida.
          </p>
          <Link to="/catalogo" className="btn btn--primary">
            Explorar catálogo
          </Link>
        </div>
      </section>

      <section className="secao">
        <h2 className="secao__titulo">Escolha sua trilha</h2>
        <div className="categorias">
          <Link to="/catalogo?categoria=Tecnologia" className="categoria-card categoria-card--tecnologia">
            <h3>Tecnologia</h3>
            <p>Programação, arquitetura de software e boas práticas.</p>
          </Link>
          <Link to="/catalogo?categoria=Idiomas" className="categoria-card categoria-card--idiomas">
            <h3>Idiomas</h3>
            <p>Métodos e guias pra aprender um novo idioma de verdade.</p>
          </Link>
        </div>
      </section>

      <section className="secao">
        <h2 className="secao__titulo">Novidades</h2>
        {carregando && <p className="estado-info">Carregando livros...</p>}
        {erro && <p className="estado-erro">Não deu pra carregar os livros: {erro}</p>}
        {!carregando && !erro && livros.length === 0 && (
          <p className="estado-info">Nenhum livro cadastrado ainda. Que tal cadastrar o primeiro?</p>
        )}
        <div className="grid-livros">
          {livros.map((livro) => (
            <BookCard key={livro.id} livro={livro} nomeAutor={autoresPorId[livro.autor_id]?.nome} />
          ))}
        </div>
      </section>
    </>
  );
}
