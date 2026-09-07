import { gerarToken } from '#utils/jwt.js';

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

export async function criarCliente(db, overrides = {}) {
  const [cliente] = await db('clientes')
    .insert({
      nome: 'Cliente Teste',
      email: `cliente-${Date.now()}-${Math.random().toString(36).slice(2)}@teste.com`,
      senha_hash: 'hash-fake-nao-usado-em-teste',
      papel: 'cliente',
      ...overrides,
    })
    .returning('*');
  return cliente;
}

export async function criarAdmin(db, overrides = {}) {
  return criarCliente(db, { papel: 'admin', ...overrides });
}

export function tokenPara(cliente) {
  return gerarToken(cliente);
}
