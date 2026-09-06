import { ErroBase } from './ErroBase.js';

export class Conflito extends ErroBase {
  constructor(mensagem = 'A requisição conflita com o estado atual do recurso.') {
    super(mensagem, 409);
  }
}
