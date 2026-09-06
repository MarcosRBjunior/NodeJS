export async function criarAutor(db, overrides = {}) {
  const [autor] = await db('autores')
    .insert({ nome: 'Autor Teste', nacionalidade: 'Brasileiro', ...overrides })
    .returning('*');
  return autor;
}

export async function criarEditora(db, overrides = {}) {
  const [editora] = await db('editoras')
    .insert({ nome: 'Editora Teste', cidade: 'São Paulo', email: 'contato@editora-teste.com', ...overrides })
    .returning('*');
  return editora;
}

export async function criarLivro(db, overrides = {}) {
  const autorId = overrides.autor_id ?? (await criarAutor(db)).id;
  const editoraId = overrides.editora_id ?? (await criarEditora(db)).id;

  const [livro] = await db('livros')
    .insert({
      titulo: 'Livro Teste',
      paginas: 100,
      ...overrides,
      autor_id: autorId,
      editora_id: editoraId,
    })
    .returning('*');
  return livro;
}
