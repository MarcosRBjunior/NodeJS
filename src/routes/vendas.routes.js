import { Router } from 'express';
import { obterConexao } from '#db/connection.js';
import { VendasService } from '#services/vendas.service.js';
import { VendasController } from '#controllers/vendas.controller.js';
import { PaymentGateway } from '#gateways/payment.gateway.js';
import { paginar } from '#middlewares/paginar.js';
import { autenticar } from '#middlewares/autenticar.js';

const db = obterConexao();

export default function criarVendasRoutes({ emailGateway, stockGateway, paymentGateway } = {}) {
  const router = Router();
  const gatewayDePagamento = paymentGateway ?? new PaymentGateway(stockGateway);
  const vendasService = new VendasService(db, emailGateway, gatewayDePagamento);
  const vendasController = new VendasController(vendasService);

  router.get('/vendas', vendasController.listarVendas, paginar({ colunasPermitidas: ['id', 'valor'] }));
  router.get('/vendas/:id', vendasController.buscarVendaPorId);
  router.post('/vendas', autenticar, vendasController.cadastrarVenda);
  router.post('/vendas/:id/confirmar-pagamento', autenticar, vendasController.confirmarPagamento);

  return router;
}
