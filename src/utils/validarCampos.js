import { RequisicaoIncorreta } from '#erros/RequisicaoIncorreta.js';

export function validarObrigatorios(dados, campos) {
  const faltando = campos.filter((campo) => dados[campo] === undefined || dados[campo] === null || dados[campo] === '');

  if (faltando.length > 0) {
    throw new RequisicaoIncorreta(`Campo(s) obrigatório(s) não informado(s): ${faltando.join(', ')}`);
  }
}

export function validarNumeroPositivo(valor, nomeCampo) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new RequisicaoIncorreta(`${nomeCampo} deve ser um número positivo.`);
  }
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(email) {
  if (typeof email !== 'string' || !REGEX_EMAIL.test(email)) {
    throw new RequisicaoIncorreta('E-mail inválido.');
  }
}

export function validarTamanhoMinimo(valor, nomeCampo, tamanho) {
  if (typeof valor !== 'string' || valor.length < tamanho) {
    throw new RequisicaoIncorreta(`${nomeCampo} deve ter pelo menos ${tamanho} caracteres.`);
  }
}
