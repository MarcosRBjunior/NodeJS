import { Router } from 'express';
import { obterConexao } from '#db/connection.js';
import { LivrosService } from '#services/livros.service.js';
import { LivrosController } from '#controllers/livros.controller.js';
import { paginar } from '#middlewares/paginar.js';
import { autenticar } from '#middlewares/autenticar.js';
import { exigirAdmin } from '#middlewares/exigirAdmin.js';

const db = obterConexao();
const COLUNAS_ORDENACAO = ['id', 'titulo', 'paginas'];

export default function criarLivrosRoutes() {
  const router = Router();
  const livrosService = new LivrosService(db);
  const livrosController = new LivrosController(livrosService);

  router.get('/livros', livrosController.listarLivros, paginar({ colunasPermitidas: COLUNAS_ORDENACAO }));
  router.get('/livros/busca', livrosController.buscarLivroPorFiltro, paginar({ colunasPermitidas: COLUNAS_ORDENACAO }));
  router.get('/livros/:id', livrosController.buscarLivroPorId);
  router.post('/livros', autenticar, exigirAdmin, livrosController.cadastrarLivro);

  return router;
}
