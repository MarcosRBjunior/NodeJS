import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const TAMANHO_HASH = 64;

export async function gerarHash(senha) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(senha, salt, TAMANHO_HASH);
  return `${salt}:${hash.toString('hex')}`;
}

export async function verificarSenha(senha, hashArmazenado) {
  const [salt, hashHex] = hashArmazenado.split(':');
  const hashCalculado = await scrypt(senha, salt, TAMANHO_HASH);
  const hashArmazenadoBuffer = Buffer.from(hashHex, 'hex');

  if (hashArmazenadoBuffer.length !== hashCalculado.length) return false;
  return timingSafeEqual(hashArmazenadoBuffer, hashCalculado);
}
