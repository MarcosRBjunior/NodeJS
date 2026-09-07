import { describe, it, expect } from 'vitest';
import { formatarPreco } from './formatarPreco';

describe('formatarPreco', () => {
  it('formata valor inteiro como moeda brasileira', () => {
    expect(formatarPreco(100)).toMatch(/^R\$\s?100,00$/);
  });

  it('formata valor com centavos', () => {
    expect(formatarPreco(89.9)).toMatch(/^R\$\s?89,90$/);
  });

  it('aceita valor em formato string numérica (como vem da API)', () => {
    expect(formatarPreco('149.90')).toMatch(/^R\$\s?149,90$/);
  });
});
