import assert from 'node:assert';

export function assertMock(mockFn, esperado) {
  assert.strictEqual(mockFn.mock.callCount(), 1);
  assert.deepStrictEqual(mockFn.mock.calls[0].arguments, esperado);
}
