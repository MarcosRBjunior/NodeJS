import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    login: vi.fn(),
    registrar: vi.fn(),
  },
}));

function PainelDeTeste() {
  const { cliente, estaAutenticado, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="autenticado">{String(estaAutenticado)}</span>
      <span data-testid="nome">{cliente?.nome ?? ''}</span>
      <button onClick={() => login('ana@teste.com', 'senha1234')}>Entrar</button>
      <button onClick={logout}>Sair</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('autentica o cliente após login com sucesso', async () => {
    api.login.mockResolvedValue({ cliente: { id: 1, nome: 'Ana', papel: 'cliente' }, token: 'token-fake' });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <PainelDeTeste />
      </AuthProvider>,
    );

    expect(screen.getByTestId('autenticado')).toHaveTextContent('false');

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByTestId('autenticado')).toHaveTextContent('true');
    expect(screen.getByTestId('nome')).toHaveTextContent('Ana');
    expect(api.login).toHaveBeenCalledWith({ email: 'ana@teste.com', senha: 'senha1234' });
  });

  it('limpa o estado ao fazer logout', async () => {
    api.login.mockResolvedValue({ cliente: { id: 1, nome: 'Ana', papel: 'cliente' }, token: 'token-fake' });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <PainelDeTeste />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByTestId('autenticado')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(screen.getByTestId('autenticado')).toHaveTextContent('false');
    expect(screen.getByTestId('nome')).toHaveTextContent('');
  });
});
