import { NaoEncontrado } from '#erros/NaoEncontrado.js';
import { asyncHandler } from '#middlewares/asyncHandler.js';
import { validarObrigatorios, validarEmail, validarTamanhoMinimo } from '#utils/validarCampos.js';

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  registrar = asyncHandler(async (req, res) => {
    const { nome, email, senha } = req.body ?? {};
    validarObrigatorios({ nome, email, senha }, ['nome', 'email', 'senha']);
    validarEmail(email);
    validarTamanhoMinimo(senha, 'senha', 8);

    const resultado = await this.authService.registrar({ nome, email, senha });
    res.status(201).send(resultado);
  });

  login = asyncHandler(async (req, res) => {
    const { email, senha } = req.body ?? {};
    validarObrigatorios({ email, senha }, ['email', 'senha']);

    const resultado = await this.authService.login({ email, senha });
    res.status(200).send(resultado);
  });

  me = asyncHandler(async (req, res) => {
    const cliente = await this.authService.buscarPorId(req.cliente.id);
    if (!cliente) throw new NaoEncontrado('Cliente não encontrado');
    res.status(200).send(cliente);
  });
}
