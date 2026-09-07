import { obterToken } from '../utils/tokenStorage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function requisitar(caminho, opcoes = {}) {
  const token = obterToken();
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opcoes,
  });

  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = new Error(corpo?.erro || `Erro ${resposta.status} ao acessar ${caminho}`);
    erro.status = resposta.status;
    throw erro;
  }

  return corpo;
}

function paraQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') query.set(chave, valor);
  }
  const texto = query.toString();
  return texto ? `?${texto}` : '';
}

export const api = {
  listarLivros: (params) => requisitar(`/livros${paraQueryString(params)}`),
  buscarLivros: (params) => requisitar(`/livros/busca${paraQueryString(params)}`),
  buscarLivroPorId: (id) => requisitar(`/livros/${id}`),
  cadastrarLivro: (dados) => requisitar('/livros', { method: 'POST', body: JSON.stringify(dados) }),

  listarAutores: (params) => requisitar(`/autores${paraQueryString(params)}`),
  buscarAutorPorId: (id) => requisitar(`/autores/${id}`),
  cadastrarAutor: (dados) => requisitar('/autores', { method: 'POST', body: JSON.stringify(dados) }),

  listarEditoras: (params) => requisitar(`/editoras${paraQueryString(params)}`),
  buscarEditoraPorId: (id) => requisitar(`/editoras/${id}`),
  cadastrarEditora: (dados) => requisitar('/editoras', { method: 'POST', body: JSON.stringify(dados) }),

  registrarVenda: (dados) => requisitar('/vendas', { method: 'POST', body: JSON.stringify(dados) }),

  registrar: (dados) => requisitar('/auth/registrar', { method: 'POST', body: JSON.stringify(dados) }),
  login: (dados) => requisitar('/auth/login', { method: 'POST', body: JSON.stringify(dados) }),
  me: () => requisitar('/auth/me'),
};
