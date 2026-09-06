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
