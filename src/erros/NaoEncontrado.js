import { ErroBase } from './ErroBase.js';

export class NaoEncontrado extends ErroBase {
  constructor(mensagem = 'Recurso não encontrado') {
    super(mensagem, 404);
  }
}
