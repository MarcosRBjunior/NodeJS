import { ErroBase } from './ErroBase.js';

export class NaoAutorizado extends ErroBase {
  constructor(mensagem = 'É necessário autenticar-se para acessar este recurso.') {
    super(mensagem, 401);
  }
}
