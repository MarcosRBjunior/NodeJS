import { NaoAutorizado } from '#erros/NaoAutorizado.js';
import { verificarToken } from '#utils/jwt.js';

export function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization ?? '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return next(new NaoAutorizado());
  }

  try {
    req.cliente = verificarToken(token);
    next();
  } catch {
    next(new NaoAutorizado('Token inválido ou expirado.'));
  }
}
