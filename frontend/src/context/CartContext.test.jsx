import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from './CartContext';

const LIVRO_TESTE = { id: 1, titulo: 'Clean Code', preco: 129.9, capa_url: null };

function PainelDeTeste() {
  const { itens, totalItens, subtotal, adicionarItem, removerItem } = useCart();
  return (
    <div>
      <span data-testid="total-itens">{totalItens}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <button onClick={() => adicionarItem(LIVRO_TESTE)}>Adicionar ao carrinho</button>
      {itens.map((item) => (
        <div key={item.id}>
          <span>{item.titulo}</span>
          <button onClick={() => removerItem(item.id)}>Remover</button>
        </div>
      ))}
    </div>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adiciona um item ao carrinho quando o usuário clica em "Adicionar ao carrinho"', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <PainelDeTeste />
      </CartProvider>,
    );

    expect(screen.getByTestId('total-itens')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));

    expect(screen.getByTestId('total-itens')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('129.9');
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
  });

  it('soma quantidade em vez de duplicar ao adicionar o mesmo livro duas vezes', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <PainelDeTeste />
      </CartProvider>,
    );

    const botaoAdicionar = screen.getByRole('button', { name: 'Adicionar ao carrinho' });
    await user.click(botaoAdicionar);
    await user.click(botaoAdicionar);

    expect(screen.getByTestId('total-itens')).toHaveTextContent('2');
    expect(screen.getAllByText('Clean Code')).toHaveLength(1);
  });

  it('remove o item do carrinho quando o usuário clica em "Remover"', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <PainelDeTeste />
      </CartProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));
    await user.click(screen.getByRole('button', { name: 'Remover' }));

    expect(screen.getByTestId('total-itens')).toHaveTextContent('0');
    expect(screen.queryByText('Clean Code')).not.toBeInTheDocument();
  });
});
