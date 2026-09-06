import { ErroBase } from '#erros/ErroBase.js';
import { RequisicaoIncorreta } from '#erros/RequisicaoIncorreta.js';

const CODIGOS_ERRO_POSTGRES = {
  '22P02': () => new RequisicaoIncorreta('Um ou mais parâmetros fornecidos são inválidos.'),
  '23502': () => new RequisicaoIncorreta('Um campo obrigatório não foi preenchido.'),
  '23503': () => new RequisicaoIncorreta('O registro referenciado não existe.'),
  '23505': () => new RequisicaoIncorreta('Já existe um registro com esses dados.'),
};

// eslint-disable-next-line no-unused-vars
export function manipuladorDeErros(erro, req, res, next) {
  if (erro instanceof ErroBase) {
    return erro.enviarResposta(res);
  }

  const erroMapeado = CODIGOS_ERRO_POSTGRES[erro.code];
  if (erroMapeado) {
    return erroMapeado().enviarResposta(res);
  }

  // express.json() lança um SyntaxError com status 400 quando o corpo não é um JSON válido.
  if (erro.type === 'entity.parse.failed' || (erro instanceof SyntaxError && erro.status === 400)) {
    return new RequisicaoIncorreta('Corpo da requisição não é um JSON válido.').enviarResposta(res);
  }

  console.error('Erro não tratado:', erro);
  new ErroBase().enviarResposta(res);
}
