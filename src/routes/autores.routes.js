import { Router } from 'express';
import { obterConexao } from '#db/connection.js';
import { AutoresService } from '#services/autores.service.js';
import { AutoresController } from '#controllers/autores.controller.js';
import { paginar } from '#middlewares/paginar.js';
import { autenticar } from '#middlewares/autenticar.js';
import { exigirAdmin } from '#middlewares/exigirAdmin.js';

const db = obterConexao();

export default function criarAutoresRoutes() {
  const router = Router();
  const autoresService = new AutoresService(db);
  const autoresController = new AutoresController(autoresService);

  router.get('/autores', autoresController.listarAutores, paginar({ colunasPermitidas: ['id', 'nome'] }));
  router.get('/autores/:id', autoresController.buscarAutorPorId);
  router.post('/autores', autenticar, exigirAdmin, autoresController.cadastrarAutor);

  return router;
}
