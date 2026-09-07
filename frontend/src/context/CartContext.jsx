import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'library-fast:carrinho';

function carregarCarrinhoInicial() {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    return bruto ? JSON.parse(bruto) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [itens, setItens] = useState(carregarCarrinhoInicial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    } catch {
      // localStorage indisponível (modo privado, etc.) — carrinho segue só em memória.
    }
  }, [itens]);

  function adicionarItem(livro, quantidade = 1) {
    setItens((atual) => {
      const existente = atual.find((item) => item.id === livro.id);
      if (existente) {
        return atual.map((item) => (item.id === livro.id ? { ...item, quantidade: item.quantidade + quantidade } : item));
      }
      return [...atual, { id: livro.id, titulo: livro.titulo, preco: Number(livro.preco), capa_url: livro.capa_url, quantidade }];
    });
  }

  function atualizarQuantidade(id, quantidade) {
    if (quantidade <= 0) {
      removerItem(id);
      return;
    }
    setItens((atual) => atual.map((item) => (item.id === id ? { ...item, quantidade } : item)));
  }

  function removerItem(id) {
    setItens((atual) => atual.filter((item) => item.id !== id));
  }

  function limparCarrinho() {
    setItens([]);
  }

  const totalItens = useMemo(() => itens.reduce((soma, item) => soma + item.quantidade, 0), [itens]);
  const subtotal = useMemo(() => itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0), [itens]);

  const valor = { itens, adicionarItem, atualizarQuantidade, removerItem, limparCarrinho, totalItens, subtotal };

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
}

export function useCart() {
  const contexto = useContext(CartContext);
  if (!contexto) throw new Error('useCart precisa ser usado dentro de um CartProvider');
  return contexto;
}
