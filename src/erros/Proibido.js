import { ErroBase } from './ErroBase.js';

export class Proibido extends ErroBase {
  constructor(mensagem = 'Você não tem permissão para acessar este recurso.') {
    super(mensagem, 403);
  }
}
