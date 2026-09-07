import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Admin() {
  const [autores, setAutores] = useState([]);
  const [editoras, setEditoras] = useState([]);
  const [mensagem, setMensagem] = useState(null);

  function recarregarListas() {
    api.listarAutores({ limite: 100 }).then(setAutores).catch(() => {});
    api.listarEditoras({ limite: 100 }).then(setEditoras).catch(() => {});
  }

  useEffect(recarregarListas, []);

  function avisar(texto, tipo = 'sucesso') {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 4000);
  }

  return (
    <section className="secao secao--estreita">
      <h1 className="secao__titulo">Cadastrar</h1>
      {mensagem && <p className={mensagem.tipo === 'erro' ? 'estado-erro' : 'estado-sucesso'}>{mensagem.texto}</p>}

      <FormAutor onCriado={(autor) => { recarregarListas(); avisar(`Autor "${autor.nome}" cadastrado.`); }} onErro={(e) => avisar(e.message, 'erro')} />
      <FormEditora onCriado={(editora) => { recarregarListas(); avisar(`Editora "${editora.nome}" cadastrada.`); }} onErro={(e) => avisar(e.message, 'erro')} />
      <FormLivro autores={autores} editoras={editoras} onCriado={(livro) => avisar(`Livro "${livro.titulo}" cadastrado.`)} onErro={(e) => avisar(e.message, 'erro')} />
    </section>
  );
}

function FormAutor({ onCriado, onErro }) {
  const [nome, setNome] = useState('');
  const [nacionalidade, setNacionalidade] = useState('');

  async function aoSubmeter(evento) {
    evento.preventDefault();
    try {
      const autor = await api.cadastrarAutor({ nome, nacionalidade });
      setNome('');
      setNacionalidade('');
      onCriado(autor);
    } catch (e) {
      onErro(e);
    }
  }

  return (
    <form className="form-cadastro" onSubmit={aoSubmeter}>
      <h2>Novo autor</h2>
      <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <input placeholder="Nacionalidade" value={nacionalidade} onChange={(e) => setNacionalidade(e.target.value)} required />
      <button type="submit" className="btn btn--secondary">
        Cadastrar autor
      </button>
    </form>
  );
}

function FormEditora({ onCriado, onErro }) {
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [email, setEmail] = useState('');

  async function aoSubmeter(evento) {
    evento.preventDefault();
    try {
      const editora = await api.cadastrarEditora({ nome, cidade, email });
      setNome('');
      setCidade('');
      setEmail('');
      onCriado(editora);
    } catch (e) {
      onErro(e);
    }
  }

  return (
    <form className="form-cadastro" onSubmit={aoSubmeter}>
      <h2>Nova editora</h2>
      <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <input placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} required />
      <input type="email" placeholder="Email de contato" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <button type="submit" className="btn btn--secondary">
        Cadastrar editora
      </button>
    </form>
  );
}

function FormLivro({ autores, editoras, onCriado, onErro }) {
  const [titulo, setTitulo] = useState('');
  const [paginas, setPaginas] = useState('');
  const [autorId, setAutorId] = useState('');
  const [editoraId, setEditoraId] = useState('');
  const [preco, setPreco] = useState('');
  const [capaUrl, setCapaUrl] = useState('');
  const [categoria, setCategoria] = useState('Tecnologia');

  async function aoSubmeter(evento) {
    evento.preventDefault();
    try {
      const livro = await api.cadastrarLivro({
        titulo,
        paginas: Number(paginas),
        autor_id: Number(autorId),
        editora_id: Number(editoraId),
        preco: preco ? Number(preco) : undefined,
        capa_url: capaUrl || undefined,
        categoria,
      });
      setTitulo('');
      setPaginas('');
      setPreco('');
      setCapaUrl('');
      onCriado(livro);
    } catch (e) {
      onErro(e);
    }
  }

  return (
    <form className="form-cadastro" onSubmit={aoSubmeter}>
      <h2>Novo livro</h2>
      <input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      <input type="number" min="1" placeholder="Páginas" value={paginas} onChange={(e) => setPaginas(e.target.value)} required />

      <select value={autorId} onChange={(e) => setAutorId(e.target.value)} required>
        <option value="">Selecione o autor</option>
        {autores.map((autor) => (
          <option key={autor.id} value={autor.id}>
            {autor.nome}
          </option>
        ))}
      </select>

      <select value={editoraId} onChange={(e) => setEditoraId(e.target.value)} required>
        <option value="">Selecione a editora</option>
        {editoras.map((editora) => (
          <option key={editora.id} value={editora.id}>
            {editora.nome}
          </option>
        ))}
      </select>

      <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        <option value="Tecnologia">Tecnologia</option>
        <option value="Idiomas">Idiomas</option>
      </select>

      <input type="number" step="0.01" min="0" placeholder="Preço (R$)" value={preco} onChange={(e) => setPreco(e.target.value)} />
      <input placeholder="URL da capa (opcional)" value={capaUrl} onChange={(e) => setCapaUrl(e.target.value)} />

      <button type="submit" className="btn btn--secondary" disabled={!autores.length || !editoras.length}>
        Cadastrar livro
      </button>
      {(!autores.length || !editoras.length) && <p className="estado-info">Cadastre ao menos um autor e uma editora primeiro.</p>}
    </form>
  );
}
