import { criarApp } from './app.js';
import { EmailGateway } from '#gateways/email.gateway.js';
import { StockGateway } from '#gateways/stock.gateway.js';
import { serverConfig } from '#config/server.config.js';
import { obterConexao } from '#db/connection.js';

const app = criarApp({
  emailGateway: new EmailGateway(),
  stockGateway: new StockGateway(),
});

async function iniciar() {
  try {
    await obterConexao().raw('select 1');
  } catch (erro) {
    console.error('Falha ao conectar ao banco de dados:', erro.message);
    process.exit(1);
  }

  app.listen(serverConfig.port, () => {
    console.log(`Servidor rodando na porta ${serverConfig.port}`);
  });
}

iniciar();
