import { Router } from 'express';
import { obterConexao } from '#db/connection.js';
import { VendasService } from '#services/vendas.service.js';
import { VendasController } from '#controllers/vendas.controller.js';
import { paginar } from '#middlewares/paginar.js';

const db = obterConexao();

export default function criarVendasRoutes({ emailGateway, stockGateway } = {}) {
  const router = Router();
  const vendasService = new VendasService(db, emailGateway, stockGateway);
  const vendasController = new VendasController(vendasService);

  router.get('/vendas', vendasController.listarVendas, paginar({ colunasPermitidas: ['id', 'valor'] }));
  router.get('/vendas/:id', vendasController.buscarVendaPorId);
  router.post('/vendas', vendasController.cadastrarVenda);

  return router;
}
