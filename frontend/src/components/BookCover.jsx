const CATEGORIA_GRADIENTE = {
  Tecnologia: 'linear-gradient(135deg, #1B1F3B 0%, #2B3A67 100%)',
  Idiomas: 'linear-gradient(135deg, #0F5E56 0%, #2EC4B6 100%)',
};

function iniciais(titulo = '') {
  return titulo
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palavra) => palavra[0]?.toUpperCase())
    .join('');
}

export function BookCover({ capaUrl, titulo, categoria, className = '' }) {
  if (capaUrl) {
    return <img className={`book-cover ${className}`} src={capaUrl} alt={`Capa de ${titulo}`} loading="lazy" />;
  }

  const fundo = CATEGORIA_GRADIENTE[categoria] || CATEGORIA_GRADIENTE.Tecnologia;

  return (
    <div className={`book-cover book-cover--placeholder ${className}`} style={{ background: fundo }}>
      <span className="book-cover__iniciais">{iniciais(titulo)}</span>
      <span className="book-cover__aviso">capa em breve</span>
    </div>
  );
}
