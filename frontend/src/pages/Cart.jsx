import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
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
  const { itens, atualizarQuantidade, removerItem, limparCarrinho, subtotal } = useCart();
  const [modoPagamento, setModoPagamento] = useState('PIX');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  const desconto = DESCONTOS[modoPagamento] ?? 0;
  const totalComDesconto = subtotal * (1 - desconto);

  async function finalizarCompra() {
    setProcessando(true);
    setErro(null);
    try {
      const vendas = await Promise.all(
        itens.map((item) =>
          api.registrarVenda({ idLivro: item.id, valor: item.preco * item.quantidade, modoPagamento }),
        ),
      );
      const totalFinal = vendas.reduce((soma, venda) => soma + Number(venda.valor), 0);
      setConfirmacao({ vendas, totalFinal });
      limparCarrinho();
    } catch (e) {
      setErro(e.message);
    } finally {
      setProcessando(false);
    }
  }

  if (confirmacao) {
    return (
      <section className="secao secao--estreita">
        <h1 className="secao__titulo">Compra confirmada!</h1>
        <p className="estado-sucesso">
          {confirmacao.vendas.length} item(ns) comprado(s) — total pago: <strong>{formatarPreco(confirmacao.totalFinal)}</strong>
        </p>
        <Link to="/catalogo" className="btn btn--primary">
          Continuar comprando
        </Link>
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
