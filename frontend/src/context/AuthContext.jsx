import { createContext, useContext, useState } from 'react';
import { api } from '../api/client';
import { salvarSessao, limparSessao, obterClienteSalvo } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [cliente, setCliente] = useState(obterClienteSalvo);

  async function login(email, senha) {
    const resultado = await api.login({ email, senha });
    salvarSessao(resultado);
    setCliente(resultado.cliente);
  }

  async function registrar(nome, email, senha) {
    const resultado = await api.registrar({ nome, email, senha });
    salvarSessao(resultado);
    setCliente(resultado.cliente);
  }

  function logout() {
    limparSessao();
    setCliente(null);
  }

  const valor = {
    cliente,
    estaAutenticado: Boolean(cliente),
    ehAdmin: cliente?.papel === 'admin',
    login,
    registrar,
    logout,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  return contexto;
}
