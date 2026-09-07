import { Proibido } from '#erros/Proibido.js';

export function exigirAdmin(req, res, next) {
  if (req.cliente?.papel !== 'admin') {
    return next(new Proibido('Apenas administradores podem acessar este recurso.'));
  }
  next();
}
