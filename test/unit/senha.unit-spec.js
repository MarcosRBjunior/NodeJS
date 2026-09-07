import { describe, it } from 'node:test';
import assert from 'node:assert';
import { gerarHash, verificarSenha } from '#domain/senha.js';

describe('senha (unit)', () => {
  it('gera um hash diferente da senha original', async () => {
    const hash = await gerarHash('minhaSenha123');
    assert.notStrictEqual(hash, 'minhaSenha123');
    assert.match(hash, /^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('verifica com sucesso a senha correta contra o hash', async () => {
    const hash = await gerarHash('minhaSenha123');
    const valido = await verificarSenha('minhaSenha123', hash);
    assert.strictEqual(valido, true);
  });

  it('rejeita uma senha incorreta', async () => {
    const hash = await gerarHash('minhaSenha123');
    const valido = await verificarSenha('senhaErrada', hash);
    assert.strictEqual(valido, false);
  });

  it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
    const hash1 = await gerarHash('mesmaSenha');
    const hash2 = await gerarHash('mesmaSenha');
    assert.notStrictEqual(hash1, hash2);
  });
});
