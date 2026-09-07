import Cliente from '#models/cliente.js';
import { gerarHash, verificarSenha } from '#domain/senha.js';
import { gerarToken } from '#utils/jwt.js';
import { RequisicaoIncorreta } from '#erros/RequisicaoIncorreta.js';

function comToken(cliente) {
  const { senha_hash, ...clientePublico } = cliente;
  return { cliente: clientePublico, token: gerarToken(cliente) };
}

export class AuthService {
  constructor(databaseConnection) {
    Cliente.configurarDB(databaseConnection);
  }

  async registrar({ nome, email, senha }) {
    const senhaHash = await gerarHash(senha);
    const cliente = new Cliente({ nome, email, senha_hash: senhaHash });
    const criado = await cliente.salvar();
    return comToken(criado);
  }

  async login({ email, senha }) {
    const cliente = await Cliente.pegarPeloEmail(email);
    if (!cliente) throw new RequisicaoIncorreta('E-mail ou senha inválidos.');

    const senhaValida = await verificarSenha(senha, cliente.senha_hash);
    if (!senhaValida) throw new RequisicaoIncorreta('E-mail ou senha inválidos.');

    return comToken(cliente);
  }

  async buscarPorId(id) {
    const cliente = await Cliente.pegarPeloId(id);
    if (!cliente) return null;
    const { senha_hash, ...clientePublico } = cliente;
    return clientePublico;
  }
}
