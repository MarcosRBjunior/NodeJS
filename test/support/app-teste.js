import { mock } from 'node:test';
import { criarApp } from '#src/app.js';

export function criarAppDeTeste({ emailGateway, stockGateway } = {}) {
  return criarApp({
    emailGateway: emailGateway ?? { enviar: mock.fn(async () => {}) },
    stockGateway: stockGateway ?? { consultarEstoque: mock.fn(async () => true) },
  });
}
