import { mock } from 'node:test';

export function criarMockResponse() {
  const res = {};
  res.status = mock.fn(() => res);
  res.send = mock.fn(() => res);
  res.json = mock.fn(() => res);
  return res;
}
