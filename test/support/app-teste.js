import { mock } from 'node:test';
import { criarApp } from '#src/app.js';
import { StockGateway } from '#gateways/stock.gateway.js';

export function criarAppDeTeste({ emailGateway, stockGateway } = {}) {
  return criarApp({
    emailGateway: emailGateway ?? { enviar: mock.fn(async () => {}) },
    stockGateway: stockGateway ?? new StockGateway(),
  });
}
