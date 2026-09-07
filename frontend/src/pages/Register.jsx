import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await registrar(nome, email, senha);
      navigate('/', { replace: true });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="secao secao--estreita">
      <h1 className="secao__titulo">Criar conta</h1>
      <form className="form-cadastro" onSubmit={aoSubmeter}>
        <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Senha (mín. 8 caracteres)"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={8}
          required
        />
        {erro && <p className="estado-erro">{erro}</p>}
        <button type="submit" className="btn btn--primary" disabled={enviando}>
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
      <p className="estado-info">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </section>
  );
}
