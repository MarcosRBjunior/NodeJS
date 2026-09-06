import { NaoEncontrado } from '#erros/NaoEncontrado.js';

export function manipulador404(req, res, next) {
  next(new NaoEncontrado('Rota não encontrada'));
}
