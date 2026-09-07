import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const destino = location.state?.de || '/';

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha);
      navigate(destino, { replace: true });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="secao secao--estreita">
      <h1 className="secao__titulo">Entrar</h1>
      <form className="form-cadastro" onSubmit={aoSubmeter}>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {erro && <p className="estado-erro">{erro}</p>}
        <button type="submit" className="btn btn--primary" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="estado-info">
        Não tem conta? <Link to="/registrar">Criar conta</Link>
      </p>
    </section>
  );
}
