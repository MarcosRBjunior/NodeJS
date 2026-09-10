import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Cart } from './Cart';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    registrarVenda: vi.fn(),
    confirmarPagamento: vi.fn(),
  },
}));

function semearSessaoAutenticada() {
  localStorage.setItem('library-fast:token', 'token-fake');
  localStorage.setItem('library-fast:cliente', JSON.stringify({ id: 1, nome: 'Ana', papel: 'cliente' }));
}

function semearCarrinho(itens) {
  localStorage.setItem('library-fast:carrinho', JSON.stringify(itens));
}

function renderizarCarrinho() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Cart />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Cart', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('cria a venda como pendente, mostra "Processando pagamento..." e depois o resultado aprovado com o valor pago', async () => {
    semearSessaoAutenticada();
    semearCarrinho([{ id: 1, titulo: 'Clean Code', preco: 100, quantidade: 1, estoqueQuantidade: 10 }]);
    api.registrarVenda.mockResolvedValue({ id: 1, status: 'pendente', valor: 92 });
    let resolverConfirmacao;
    api.confirmarPagamento.mockReturnValue(new Promise((resolve) => (resolverConfirmacao = resolve)));

    renderizarCarrinho();
    screen.getByRole('button', { name: 'Finalizar compra' }).click();

    await waitFor(() => expect(screen.getByText('Processando pagamento...')).toBeInTheDocument());

    resolverConfirmacao({ id: 1, status: 'aprovado', valor: 92, motivo_recusa: null });

    await waitFor(() => expect(screen.getByText(/item\(ns\) aprovado\(s\)/)).toBeInTheDocument());
    expect(screen.getByText(/Clean Code/)).toBeInTheDocument();
    expect(api.confirmarPagamento).toHaveBeenCalledWith(1);
  });

  it('mostra o item recusado com o motivo quando a confirmação de pagamento recusa', async () => {
    semearSessaoAutenticada();
    semearCarrinho([{ id: 1, titulo: 'Livro Recusado', preco: 100, quantidade: 13, estoqueQuantidade: 20 }]);
    api.registrarVenda.mockResolvedValue({ id: 5, status: 'pendente', valor: 100 });
    api.confirmarPagamento.mockResolvedValue({ id: 5, status: 'recusado', motivo_recusa: 'pagamento recusado' });

    renderizarCarrinho();
    screen.getByRole('button', { name: 'Finalizar compra' }).click();

    await waitFor(() => expect(screen.getByText(/item\(ns\) recusado\(s\)/)).toBeInTheDocument());
    expect(screen.getByText(/pagamento recusado/)).toBeInTheDocument();
  });

  it('mostra resultado misto quando um item aprova e outro é recusado', async () => {
    semearSessaoAutenticada();
    semearCarrinho([
      { id: 1, titulo: 'Aprovado', preco: 100, quantidade: 1, estoqueQuantidade: 10 },
      { id: 2, titulo: 'Recusado', preco: 100, quantidade: 13, estoqueQuantidade: 20 },
    ]);
    api.registrarVenda.mockImplementation(({ idLivro }) =>
      Promise.resolve({ id: idLivro, status: 'pendente', valor: 100 }),
    );
    api.confirmarPagamento.mockImplementation((id) =>
      id === 1
        ? Promise.resolve({ id, status: 'aprovado', valor: 92, motivo_recusa: null })
        : Promise.resolve({ id, status: 'recusado', motivo_recusa: 'pagamento recusado' }),
    );

    renderizarCarrinho();
    screen.getByRole('button', { name: 'Finalizar compra' }).click();

    await waitFor(() => expect(screen.getByText(/1 item\(ns\) aprovado\(s\)/)).toBeInTheDocument());
    expect(screen.getByText(/1 item\(ns\) recusado\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/Aprovado/)).toBeInTheDocument();
    expect(screen.getByText(/Recusado/)).toBeInTheDocument();
  });

  it('não chama confirmar-pagamento quando a criação da venda falha (mantém erro genérico no carrinho)', async () => {
    semearSessaoAutenticada();
    semearCarrinho([{ id: 1, titulo: 'Sem Estoque', preco: 100, quantidade: 1, estoqueQuantidade: 10 }]);
    const erro409 = Object.assign(new Error('livro sem estoque disponível'), { status: 409 });
    api.registrarVenda.mockRejectedValue(erro409);

    renderizarCarrinho();
    screen.getByRole('button', { name: 'Finalizar compra' }).click();

    await waitFor(() => expect(screen.getByText(/Não foi possível comprar/)).toBeInTheDocument());
    expect(api.confirmarPagamento).not.toHaveBeenCalled();
  });
});
