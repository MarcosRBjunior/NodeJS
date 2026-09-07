const CHAVE_TOKEN = 'library-fast:token';
const CHAVE_CLIENTE = 'library-fast:cliente';

export function salvarSessao({ cliente, token }) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_CLIENTE, JSON.stringify(cliente));
  } catch {
    // localStorage indisponível (modo privado, etc.) — sessão dura só em memória.
  }
}

export function limparSessao() {
  try {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_CLIENTE);
  } catch {
    // idem acima.
  }
}

export function obterToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function obterClienteSalvo() {
  try {
    const bruto = localStorage.getItem(CHAVE_CLIENTE);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}
