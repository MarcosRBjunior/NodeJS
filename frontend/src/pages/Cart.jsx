import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatarPreco } from '../utils/formatarPreco';
import { api } from '../api/client';

const DESCONTOS = {
  DINHEIRO: 0.1,
  PIX: 0.08,
  BOLETO: 0.05,
  CARTAO_DEBITO: 0.03,
  CARTAO_CREDITO: 0,
};

const RETULOS_PAGAMENTO = {
  DINHEIRO: 'Dinheiro (10% de desconto)',
  PIX: 'Pix (8% de desconto)',
  BOLETO: 'Boleto (5% de desconto)',
  CARTAO_DEBITO: 'Cartão de débito (3% de desconto)',
  CARTAO_CREDITO: 'Cartão de crédito (sem desconto)',
};

export function Cart() {
  const { itens, atualizarQuantidade, removerItem, subtotal } = useCart();
  const { estaAutenticado, logout } = useAuth();
  const navigate = useNavigate();
  const [modoPagamento, setModoPagamento] = useState('PIX');
  const [processando, setProcessando] = useState(false);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultados, setResultados] = useState(null);

  const desconto = DESCONTOS[modoPagamento] ?? 0;
  const totalComDesconto = subtotal * (1 - desconto);

  async function finalizarCompra() {
    if (!estaAutenticado) {
      navigate('/login', { state: { de: '/carrinho' } });
      return;
    }

    setProcessando(true);
    setErro(null);
    try {
      const criacoes = await Promise.allSettled(
        itens.map((item) =>
          api.registrarVenda({ idLivro: item.id, valor: item.preco * item.quantidade, modoPagamento, quantidade: item.quantidade }),
        ),
      );
      const linhasCriacao = itens.map((item, indice) => ({ item, resultado: criacoes[indice] }));

      if (linhasCriacao.some(({ resultado }) => resultado.status === 'rejected' && resultado.reason?.status === 401)) {
        logout();
        navigate('/login', { state: { de: '/carrinho' } });
        return;
      }

      const criadasComSucesso = linhasCriacao.filter(({ resultado }) => resultado.status === 'fulfilled');
      const falhasCriacao = linhasCriacao.filter(({ resultado }) => resultado.status === 'rejected');

      // remove do carrinho só o que já virou venda pendente, pra não recomprar num retry
      criadasComSucesso.forEach(({ item }) => removerItem(item.id));

      if (criadasComSucesso.length === 0) {
        const titulos = falhasCriacao.map(({ item }) => item.titulo).join(', ');
        setErro(`Não foi possível comprar: ${titulos}. ${falhasCriacao[0].resultado.reason.message}`);
        return;
      }

      setConfirmandoPagamento(true);
      const confirmacoes = await Promise.allSettled(
        criadasComSucesso.map(({ resultado }) => api.confirmarPagamento(resultado.value.id)),
      );
      const linhasConfirmacao = criadasComSucesso.map(({ item }, indice) => ({ item, resultado: confirmacoes[indice] }));

      if (linhasConfirmacao.some(({ resultado }) => resultado.status === 'rejected' && resultado.reason?.status === 401)) {
        logout();
        navigate('/login', { state: { de: '/carrinho' } });
        return;
      }

      const resultadosConfirmacao = linhasConfirmacao.map(({ item, resultado }) => {
        if (resultado.status === 'fulfilled') {
          const venda = resultado.value;
          return venda.status === 'aprovado'
            ? { titulo: item.titulo, status: 'aprovado', valor: Number(venda.valor) }
            : { titulo: item.titulo, status: 'recusado', motivo: venda.motivo_recusa };
        }
        return { titulo: item.titulo, status: 'recusado', motivo: resultado.reason?.message ?? 'não foi possível confirmar o pagamento' };
      });

      const resultadosFalhaCriacao = falhasCriacao.map(({ item, resultado }) => ({
        titulo: item.titulo,
        status: 'recusado',
        motivo: resultado.reason?.message ?? 'não foi possível criar a venda',
      }));

      setResultados([...resultadosConfirmacao, ...resultadosFalhaCriacao]);
    } catch (e) {
      setErro(e.message);
    } finally {
      setProcessando(false);
      setConfirmandoPagamento(false);
    }
  }

  if (resultados) {
    const aprovados = resultados.filter((r) => r.status === 'aprovado');
    const recusados = resultados.filter((r) => r.status === 'recusado');
    const totalPago = aprovados.reduce((soma, r) => soma + r.valor, 0);

    return (
      <section className="secao secao--estreita">
        <h1 className="secao__titulo">Resultado da compra</h1>

        {aprovados.length > 0 && (
          <div className="estado-sucesso">
            <p>
              {aprovados.length} item(ns) aprovado(s) — total pago: <strong>{formatarPreco(totalPago)}</strong>
            </p>
            <ul>
              {aprovados.map((r, indice) => (
                <li key={indice}>
                  {r.titulo} — {formatarPreco(r.valor)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recusados.length > 0 && (
          <div className="estado-erro">
            <p>{recusados.length} item(ns) recusado(s):</p>
            <ul>
              {recusados.map((r, indice) => (
                <li key={indice}>
                  {r.titulo} — {r.motivo}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link to="/catalogo" className="btn btn--primary">
          Continuar comprando
        </Link>
      </section>
    );
  }

  if (confirmandoPagamento) {
    return (
      <section className="secao secao--estreita">
        <h1 className="secao__titulo">Processando pagamento...</h1>
        <p>Aguarde enquanto confirmamos o pagamento da sua compra.</p>
      </section>
    );
  }

  if (itens.length === 0) {
    return (
      <section className="secao secao--estreita">
        <h1 className="secao__titulo">Seu carrinho está vazio</h1>
        <Link to="/catalogo" className="btn btn--primary">
          Ver catálogo
        </Link>
      </section>
    );
  }

  return (
    <section className="secao">
      <h1 className="secao__titulo">Carrinho</h1>

      <div className="carrinho">
        <ul className="carrinho__lista">
          {itens.map((item) => (
            <li key={item.id} className="carrinho__item">
              <span className="carrinho__item-titulo">{item.titulo}</span>
              <input
                type="number"
                min="1"
                max={item.estoqueQuantidade}
                value={item.quantidade}
                onChange={(e) => atualizarQuantidade(item.id, Number(e.target.value))}
                aria-label={`Quantidade de ${item.titulo}`}
              />
              <span>{formatarPreco(item.preco * item.quantidade)}</span>
              <button type="button" className="btn-link" onClick={() => removerItem(item.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>

        <aside className="carrinho__resumo">
          <h2>Resumo</h2>
          <div className="carrinho__linha">
            <span>Subtotal</span>
            <span>{formatarPreco(subtotal)}</span>
          </div>

          <label htmlFor="modoPagamento">Forma de pagamento</label>
          <select id="modoPagamento" value={modoPagamento} onChange={(e) => setModoPagamento(e.target.value)}>
            {Object.entries(RETULOS_PAGAMENTO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>

          <div className="carrinho__linha carrinho__linha--total">
            <span>Total</span>
            <span>{formatarPreco(totalComDesconto)}</span>
          </div>

          {erro && <p className="estado-erro">{erro}</p>}

          <button type="button" className="btn btn--primary btn--full" disabled={processando} onClick={finalizarCompra}>
            {processando ? 'Processando...' : 'Finalizar compra'}
          </button>
        </aside>
      </div>
    </section>
  );
}
