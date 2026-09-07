export function CategoryBadge({ categoria }) {
  if (!categoria) return null;
  const classe = categoria === 'Idiomas' ? 'badge badge--idiomas' : 'badge badge--tecnologia';
  return <span className={classe}>{categoria}</span>;
}
